from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import re
from statistics import mean

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24 * 30  # 30 days

# AI Configuration
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Security
security = HTTPBearer()

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    currency_preference: str = "USD"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    currency_preference: str = "USD"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AccountCreate(BaseModel):
    name: str
    type: str  # checking, savings, credit, cash
    balance: float
    currency: str
    bank_name: Optional[str] = None

class Account(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: str
    balance: float
    currency: str
    bank_name: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class TransactionCreate(BaseModel):
    account_id: str
    amount: float
    category: str
    description: str
    date: str
    type: str  # income or expense
    currency: str

class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    account_id: str
    amount: float
    category: str
    description: str
    date: str
    type: str
    currency: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float
    currency: str

class Budget(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    category: str
    monthly_limit: float
    spent_this_month: float = 0.0
    currency: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    deadline: str
    currency: str

class Goal(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    target_amount: float
    current_amount: float
    deadline: str
    currency: str
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class Alert(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    message: str
    type: str  # anomaly, goal, budget
    read: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class NLPExpenseInput(BaseModel):
    text: str

class AffordabilityCheck(BaseModel):
    item_name: str
    price: float
    currency: str

# ============ UTILITY FUNCTIONS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str) -> str:
    expiration = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    payload = {'user_id': user_id, 'exp': expiration}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload['user_id']
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_ai_chat():
    return LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message="You are a financial assistant AI."
    ).with_model("gemini", "gemini-3-flash-preview")

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = User(
        name=user_data.name,
        email=user_data.email,
        currency_preference=user_data.currency_preference
    )
    user_dict = user.model_dump()
    user_dict['password'] = hash_password(user_data.password)
    
    await db.users.insert_one(user_dict)
    
    # Create default account
    default_account = Account(
        user_id=user.id,
        name="Main Account",
        type="checking",
        balance=0.0,
        currency=user.currency_preference
    )
    await db.accounts.insert_one(default_account.model_dump())
    
    token = create_token(user.id)
    return {"user": user, "token": token}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_obj = User(**user)
    token = create_token(user_obj.id)
    return {"user": user_obj, "token": token}

@api_router.get("/auth/me", response_model=User)
async def get_me(user_id: str = Depends(get_current_user)):
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

# ============ ACCOUNT ENDPOINTS ============

@api_router.post("/accounts", response_model=Account)
async def create_account(account_data: AccountCreate, user_id: str = Depends(get_current_user)):
    account = Account(user_id=user_id, **account_data.model_dump())
    await db.accounts.insert_one(account.model_dump())
    return account

@api_router.get("/accounts", response_model=List[Account])
async def get_accounts(user_id: str = Depends(get_current_user)):
    accounts = await db.accounts.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return [Account(**acc) for acc in accounts]

@api_router.get("/accounts/summary")
async def get_accounts_summary(user_id: str = Depends(get_current_user)):
    accounts = await db.accounts.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    total_balance = sum(acc['balance'] for acc in accounts)
    return {"total_balance": total_balance, "account_count": len(accounts), "accounts": accounts}

@api_router.delete("/accounts/{account_id}")
async def delete_account(account_id: str, user_id: str = Depends(get_current_user)):
    result = await db.accounts.delete_one({"id": account_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Account not found")
    return {"message": "Account deleted"}

# ============ TRANSACTION ENDPOINTS ============

@api_router.post("/transactions", response_model=Transaction)
async def create_transaction(tx_data: TransactionCreate, user_id: str = Depends(get_current_user)):
    # Verify account ownership
    account = await db.accounts.find_one({"id": tx_data.account_id, "user_id": user_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Create transaction
    transaction = Transaction(user_id=user_id, **tx_data.model_dump())
    await db.transactions.insert_one(transaction.model_dump())
    
    # Update account balance
    new_balance = account['balance']
    if tx_data.type == 'income':
        new_balance += tx_data.amount
    else:
        new_balance -= tx_data.amount
    
    await db.accounts.update_one({"id": tx_data.account_id}, {"$set": {"balance": new_balance}})
    
    # Check for anomalies
    await check_spending_anomaly(user_id, transaction)
    
    return transaction

@api_router.get("/transactions", response_model=List[Transaction])
async def get_transactions(user_id: str = Depends(get_current_user), limit: int = 100):
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).sort("date", -1).to_list(limit)
    return [Transaction(**tx) for tx in transactions]

@api_router.get("/transactions/stats")
async def get_transaction_stats(user_id: str = Depends(get_current_user)):
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    total_income = sum(tx['amount'] for tx in transactions if tx['type'] == 'income')
    total_expenses = sum(tx['amount'] for tx in transactions if tx['type'] == 'expense')
    
    # Category breakdown
    category_stats = {}
    for tx in transactions:
        if tx['type'] == 'expense':
            category = tx['category']
            category_stats[category] = category_stats.get(category, 0) + tx['amount']
    
    return {
        "total_income": total_income,
        "total_expenses": total_expenses,
        "net_savings": total_income - total_expenses,
        "category_breakdown": category_stats
    }

@api_router.delete("/transactions/{transaction_id}")
async def delete_transaction(transaction_id: str, user_id: str = Depends(get_current_user)):
    # Get transaction
    tx = await db.transactions.find_one({"id": transaction_id, "user_id": user_id}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Revert account balance
    account = await db.accounts.find_one({"id": tx['account_id']}, {"_id": 0})
    if account:
        new_balance = account['balance']
        if tx['type'] == 'income':
            new_balance -= tx['amount']
        else:
            new_balance += tx['amount']
        await db.accounts.update_one({"id": tx['account_id']}, {"$set": {"balance": new_balance}})
    
    # Delete transaction
    await db.transactions.delete_one({"id": transaction_id})
    return {"message": "Transaction deleted"}

# ============ BUDGET ENDPOINTS ============

@api_router.post("/budgets", response_model=Budget)
async def create_budget(budget_data: BudgetCreate, user_id: str = Depends(get_current_user)):
    budget = Budget(user_id=user_id, **budget_data.model_dump())
    await db.budgets.insert_one(budget.model_dump())
    return budget

@api_router.get("/budgets", response_model=List[Budget])
async def get_budgets(user_id: str = Depends(get_current_user)):
    budgets = await db.budgets.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return [Budget(**b) for b in budgets]

@api_router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: str, user_id: str = Depends(get_current_user)):
    result = await db.budgets.delete_one({"id": budget_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget deleted"}

@api_router.get("/budgets/check-alerts")
async def check_budget_alerts(user_id: str = Depends(get_current_user)):
    """Check if any budgets are exceeded and return alerts"""
    budgets = await db.budgets.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    alerts = []
    
    for budget in budgets:
        # Calculate spent this month for this category
        first_day = datetime.now(timezone.utc).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        transactions = await db.transactions.find({
            "user_id": user_id,
            "category": budget['category'],
            "type": "expense",
            "date": {"$gte": first_day.isoformat()}
        }, {"_id": 0}).to_list(1000)
        
        spent = sum(tx['amount'] for tx in transactions)
        percentage = (spent / budget['monthly_limit']) * 100 if budget['monthly_limit'] > 0 else 0
        
        # Update budget spent
        await db.budgets.update_one(
            {"id": budget['id']},
            {"$set": {"spent_this_month": spent}}
        )
        
        if percentage >= 100:
            alerts.append({
                "budget_id": budget['id'],
                "category": budget['category'],
                "spent": spent,
                "limit": budget['monthly_limit'],
                "percentage": round(percentage, 1),
                "status": "exceeded"
            })
        elif percentage >= 80:
            alerts.append({
                "budget_id": budget['id'],
                "category": budget['category'],
                "spent": spent,
                "limit": budget['monthly_limit'],
                "percentage": round(percentage, 1),
                "status": "warning"
            })
    
    return {"alerts": alerts}

@api_router.put("/budgets/{budget_id}/extend")
async def extend_budget_limit(budget_id: str, new_limit: float, user_id: str = Depends(get_current_user)):
    """Extend budget limit"""
    result = await db.budgets.update_one(
        {"id": budget_id, "user_id": user_id},
        {"$set": {"monthly_limit": new_limit}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found")
    return {"message": "Budget limit extended"}

# ============ GOAL ENDPOINTS ============

@api_router.post("/goals", response_model=Goal)
async def create_goal(goal_data: GoalCreate, user_id: str = Depends(get_current_user)):
    goal = Goal(user_id=user_id, **goal_data.model_dump())
    await db.goals.insert_one(goal.model_dump())
    return goal

@api_router.get("/goals", response_model=List[Goal])
async def get_goals(user_id: str = Depends(get_current_user)):
    goals = await db.goals.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    return [Goal(**g) for g in goals]

@api_router.put("/goals/{goal_id}")
async def update_goal(goal_id: str, current_amount: float, user_id: str = Depends(get_current_user)):
    result = await db.goals.update_one(
        {"id": goal_id, "user_id": user_id},
        {"$set": {"current_amount": current_amount}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal updated"}

@api_router.delete("/goals/{goal_id}")
async def delete_goal(goal_id: str, user_id: str = Depends(get_current_user)):
    result = await db.goals.delete_one({"id": goal_id, "user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Goal not found")
    return {"message": "Goal deleted"}

# ============ ALERT ENDPOINTS ============

@api_router.get("/alerts", response_model=List[Alert])
async def get_alerts(user_id: str = Depends(get_current_user)):
    alerts = await db.alerts.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return [Alert(**a) for a in alerts]

@api_router.put("/alerts/{alert_id}/read")
async def mark_alert_read(alert_id: str, user_id: str = Depends(get_current_user)):
    result = await db.alerts.update_one(
        {"id": alert_id, "user_id": user_id},
        {"$set": {"read": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"message": "Alert marked as read"}

# ============ AI ENDPOINTS ============

@api_router.post("/ai/parse-expense")
async def parse_expense_nlp(input_data: NLPExpenseInput, user_id: str = Depends(get_current_user)):
    try:
        chat = await get_ai_chat()
        
        prompt = f"""Parse this expense entry into JSON format:
"{input_data.text}"

Extract:
- amount (number)
- category (one of: Food, Transportation, Shopping, Entertainment, Bills, Healthcare, Education, Other)
- description (string)
- date (YYYY-MM-DD format, if 'yesterday' use yesterday's date, if 'today' or not mentioned use today's date)

Return ONLY valid JSON with these exact fields. Today's date is {datetime.now(timezone.utc).strftime('%Y-%m-%d')}."""
        
        response = await chat.send_message(UserMessage(text=prompt))
        
        # Extract JSON from response
        json_match = re.search(r'\{[^}]+\}', response)
        if json_match:
            parsed = json.loads(json_match.group())
            return parsed
        else:
            # Fallback parsing
            return {
                "amount": 0,
                "category": "Other",
                "description": input_data.text,
                "date": datetime.now(timezone.utc).strftime('%Y-%m-%d')
            }
    except Exception as e:
        logger.error(f"NLP parsing error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse expense")

@api_router.get("/ai/financial-profile")
async def get_financial_profile(user_id: str = Depends(get_current_user)):
    # Get last 3 months transactions
    three_months_ago = (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    if not transactions:
        return {
            "profile_type": "New User",
            "score": 0,
            "description": "Start tracking your expenses to get personalized insights!",
            "suggestions": []
        }
    
    # Calculate metrics
    total_income = sum(tx['amount'] for tx in transactions if tx['type'] == 'income')
    total_expenses = sum(tx['amount'] for tx in transactions if tx['type'] == 'expense')
    savings_ratio = ((total_income - total_expenses) / total_income * 100) if total_income > 0 else 0
    
    # Determine profile
    if savings_ratio >= 30:
        profile_type = "Smart Saver"
        description = "You're doing great! You save a significant portion of your income."
    elif savings_ratio >= 10:
        profile_type = "Balanced"
        description = "You maintain a healthy balance between spending and saving."
    else:
        profile_type = "Spender"
        description = "You tend to spend most of your income. Consider setting savings goals."
    
    suggestions = []
    if savings_ratio < 20:
        suggestions.append("Try to save at least 20% of your income")
    if total_expenses > total_income:
        suggestions.append("Your expenses exceed income - review your spending")
    
    return {
        "profile_type": profile_type,
        "score": min(100, int(savings_ratio * 2)),
        "description": description,
        "savings_ratio": round(savings_ratio, 2),
        "suggestions": suggestions
    }

@api_router.get("/ai/predict-expenses")
async def predict_expenses(user_id: str = Depends(get_current_user)):
    # Get last 3 months transactions
    transactions = await db.transactions.find(
        {"user_id": user_id, "type": "expense"},
        {"_id": 0}
    ).to_list(1000)
    
    if not transactions:
        return {"predicted_total": 0, "category_predictions": {}}
    
    # Group by category and calculate average
    category_totals = {}
    for tx in transactions:
        category = tx['category']
        category_totals[category] = category_totals.get(category, []) + [tx['amount']]
    
    # Calculate predictions (moving average)
    category_predictions = {}
    total_prediction = 0
    
    for category, amounts in category_totals.items():
        avg = mean(amounts) if amounts else 0
        # Simple prediction: average of last transactions
        predicted = avg * 1.05  # 5% buffer
        category_predictions[category] = round(predicted, 2)
        total_prediction += predicted
    
    return {
        "predicted_total": round(total_prediction, 2),
        "category_predictions": category_predictions,
        "confidence": "medium" if len(transactions) > 20 else "low"
    }

@api_router.post("/ai/afford-check")
async def check_affordability(check: AffordabilityCheck, user_id: str = Depends(get_current_user)):
    # Get current balance
    accounts = await db.accounts.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    total_balance = sum(acc['balance'] for acc in accounts)
    
    # Get upcoming expenses (this month)
    transactions = await db.transactions.find(
        {"user_id": user_id, "type": "expense"},
        {"_id": 0}
    ).to_list(1000)
    
    # Calculate average monthly expenses
    avg_monthly_expense = mean([tx['amount'] for tx in transactions]) * 30 if transactions else 0
    
    # Get savings goals
    goals = await db.goals.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    total_goal_remaining = sum(g['target_amount'] - g['current_amount'] for g in goals)
    
    # Calculate affordability
    available_balance = total_balance - avg_monthly_expense - (total_goal_remaining * 0.1)
    
    if check.price <= available_balance * 0.3:
        status = "affordable"
        message = f"✅ You can afford this! It's within your comfortable spending range."
    elif check.price <= available_balance * 0.6:
        status = "risky"
        message = f"⚠️ This purchase is risky. It will impact your savings significantly."
    else:
        status = "not_recommended"
        # Calculate months needed
        monthly_savings = (total_balance - avg_monthly_expense) if (total_balance - avg_monthly_expense) > 0 else 100
        months_needed = (check.price / monthly_savings) if monthly_savings > 0 else 0
        message = f"❌ Not recommended. You need approximately {round(months_needed, 1)} months to afford this safely."
    
    return {
        "status": status,
        "message": message,
        "current_balance": round(total_balance, 2),
        "item_price": check.price,
        "available_for_discretionary": round(available_balance, 2)
    }

@api_router.get("/ai/health-score")
async def get_health_score(user_id: str = Depends(get_current_user)):
    # Get financial data
    accounts = await db.accounts.find({"user_id": user_id}, {"_id": 0}).to_list(100)
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    
    total_balance = sum(acc['balance'] for acc in accounts)
    total_income = sum(tx['amount'] for tx in transactions if tx['type'] == 'income')
    total_expenses = sum(tx['amount'] for tx in transactions if tx['type'] == 'expense')
    
    # Calculate score components
    score = 0
    factors = []
    
    # 1. Savings ratio (40 points)
    if total_income > 0:
        savings_ratio = ((total_income - total_expenses) / total_income) * 100
        savings_score = min(40, int(savings_ratio * 1.3))
        score += savings_score
        factors.append({"name": "Savings Ratio", "score": savings_score, "max": 40})
    
    # 2. Balance cushion (30 points)
    avg_monthly_expense = (total_expenses / len(transactions)) * 30 if transactions else 0
    months_covered = (total_balance / avg_monthly_expense) if avg_monthly_expense > 0 else 0
    cushion_score = min(30, int(months_covered * 5))
    score += cushion_score
    factors.append({"name": "Emergency Fund", "score": cushion_score, "max": 30})
    
    # 3. Spending discipline (30 points)
    if len(transactions) > 0:
        # Check for consistent spending
        discipline_score = 20  # Base score
        score += discipline_score
        factors.append({"name": "Spending Discipline", "score": discipline_score, "max": 30})
    
    # Generate suggestions
    suggestions = []
    if score < 70:
        suggestions.append("Increase your savings rate to improve your score")
    if months_covered < 3:
        suggestions.append("Build an emergency fund covering 3-6 months of expenses")
    if total_expenses > total_income:
        suggestions.append("Reduce expenses to match or stay below your income")
    
    return {
        "score": min(100, score),
        "grade": "Excellent" if score >= 80 else "Good" if score >= 60 else "Fair" if score >= 40 else "Poor",
        "factors": factors,
        "suggestions": suggestions
    }

@api_router.post("/ai/suggest-budget")
async def suggest_budget(user_id: str = Depends(get_current_user)):
    # Get last 3 months transactions
    transactions = await db.transactions.find(
        {"user_id": user_id, "type": "expense"},
        {"_id": 0}
    ).to_list(1000)
    
    if not transactions:
        return {"suggestions": []}
    
    # Calculate average spending per category
    category_spending = {}
    for tx in transactions:
        category = tx['category']
        category_spending[category] = category_spending.get(category, []) + [tx['amount']]
    
    suggestions = []
    for category, amounts in category_spending.items():
        avg_spending = mean(amounts)
        suggested_budget = round(avg_spending * 1.1, 2)  # 10% buffer
        suggestions.append({
            "category": category,
            "current_average": round(avg_spending, 2),
            "suggested_budget": suggested_budget,
            "currency": transactions[0]['currency']
        })
    
    return {"suggestions": suggestions}

@api_router.get("/ai/goal-risk/{goal_id}")
async def predict_goal_risk(goal_id: str, user_id: str = Depends(get_current_user)):
    # Get goal
    goal = await db.goals.find_one({"id": goal_id, "user_id": user_id}, {"_id": 0})
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    # Calculate progress
    remaining = goal['target_amount'] - goal['current_amount']
    deadline = datetime.fromisoformat(goal['deadline']).replace(tzinfo=timezone.utc)
    days_remaining = (deadline - datetime.now(timezone.utc)).days
    months_remaining = days_remaining / 30
    
    if months_remaining <= 0:
        return {
            "status": "overdue",
            "message": "This goal is overdue",
            "required_monthly_savings": 0
        }
    
    required_monthly = remaining / months_remaining if months_remaining > 0 else 0
    
    # Get average monthly savings
    transactions = await db.transactions.find({"user_id": user_id}, {"_id": 0}).to_list(1000)
    total_income = sum(tx['amount'] for tx in transactions if tx['type'] == 'income')
    total_expenses = sum(tx['amount'] for tx in transactions if tx['type'] == 'expense')
    avg_monthly_savings = (total_income - total_expenses) / 3 if transactions else 0  # Last 3 months
    
    # Determine risk
    if required_monthly <= avg_monthly_savings * 0.8:
        status = "on_track"
        message = f"✅ You're on track! Keep saving {round(required_monthly, 2)} per month."
    elif required_monthly <= avg_monthly_savings * 1.2:
        status = "tight"
        message = f"⚠️ It's tight but achievable. You need to save {round(required_monthly, 2)} per month."
    else:
        shortfall = required_monthly - avg_monthly_savings
        delay_months = remaining / avg_monthly_savings if avg_monthly_savings > 0 else 0
        status = "at_risk"
        message = f"❌ You're likely to miss this goal by {round(delay_months - months_remaining, 1)} months. Increase monthly savings by {round(shortfall, 2)}."
    
    return {
        "status": status,
        "message": message,
        "required_monthly_savings": round(required_monthly, 2),
        "current_monthly_savings": round(avg_monthly_savings, 2),
        "progress_percentage": round((goal['current_amount'] / goal['target_amount']) * 100, 1)
    }

async def check_spending_anomaly(user_id: str, transaction: Transaction):
    """Check if transaction is anomalous and create alert"""
    # Get past transactions in same category
    past_txs = await db.transactions.find(
        {"user_id": user_id, "category": transaction.category, "type": "expense"},
        {"_id": 0}
    ).to_list(100)
    
    if len(past_txs) < 5:  # Not enough data
        return
    
    amounts = [tx['amount'] for tx in past_txs[:-1]]  # Exclude current
    avg_amount = mean(amounts)
    
    # Check if current transaction is 2x average
    if transaction.amount >= avg_amount * 2:
        alert = Alert(
            user_id=user_id,
            message=f"Unusual spending detected! You spent {transaction.amount:.2f} on {transaction.category}, which is 2x your average.",
            type="anomaly"
        )
        await db.alerts.insert_one(alert.model_dump())

# ============ BANK INTEGRATION ENDPOINTS ============

@api_router.post("/bank/import")
async def import_transactions(transactions: List[TransactionCreate], user_id: str = Depends(get_current_user)):
    """Import transactions from bank (simulated)"""
    imported = []
    for tx_data in transactions:
        tx = Transaction(user_id=user_id, **tx_data.model_dump())
        await db.transactions.insert_one(tx.model_dump())
        imported.append(tx)
    
    return {"imported_count": len(imported), "transactions": imported}

# ============ BASIC ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "AI Budget Tracker API", "version": "1.0.0"}

@api_router.get("/currencies")
async def get_currencies():
    """Return list of supported currencies"""
    return {
        "currencies": [
            {"code": "USD", "symbol": "$", "name": "US Dollar"},
            {"code": "EUR", "symbol": "€", "name": "Euro"},
            {"code": "GBP", "symbol": "£", "name": "British Pound"},
            {"code": "INR", "symbol": "₹", "name": "Indian Rupee"},
            {"code": "JPY", "symbol": "¥", "name": "Japanese Yen"},
            {"code": "CNY", "symbol": "¥", "name": "Chinese Yuan"},
            {"code": "AUD", "symbol": "A$", "name": "Australian Dollar"},
            {"code": "CAD", "symbol": "C$", "name": "Canadian Dollar"},
            {"code": "CHF", "symbol": "Fr", "name": "Swiss Franc"},
            {"code": "SEK", "symbol": "kr", "name": "Swedish Krona"}
        ]
    }

@api_router.post("/accounts/{account_id}/family-member")
async def add_family_member(account_id: str, member_name: str, user_id: str = Depends(get_current_user)):
    """Add family member to account"""
    account = await db.accounts.find_one({"id": account_id, "user_id": user_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    family_members = account.get('family_members', [])
    family_members.append({
        "id": str(uuid.uuid4()),
        "name": member_name,
        "added_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.accounts.update_one(
        {"id": account_id},
        {"$set": {"family_members": family_members}}
    )
    return {"message": "Family member added", "family_members": family_members}

@api_router.delete("/accounts/{account_id}/family-member/{member_id}")
async def remove_family_member(account_id: str, member_id: str, user_id: str = Depends(get_current_user)):
    """Remove family member from account"""
    account = await db.accounts.find_one({"id": account_id, "user_id": user_id}, {"_id": 0})
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    family_members = account.get('family_members', [])
    family_members = [m for m in family_members if m['id'] != member_id]
    
    await db.accounts.update_one(
        {"id": account_id},
        {"$set": {"family_members": family_members}}
    )
    return {"message": "Family member removed"}

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()