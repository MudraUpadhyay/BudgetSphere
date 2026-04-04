import requests
import sys
import json
from datetime import datetime, timedelta

class AIBudgetTrackerTester:
    def __init__(self, base_url="https://smart-finance-hub-52.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.account_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, params=params)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.content else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.failed_tests.append(f"{name}: Expected {expected_status}, got {response.status_code}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append(f"{name}: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        test_email = f"test{datetime.now().strftime('%H%M%S')}@smartbudget.com"
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data={
                "name": "Test User",
                "email": test_email,
                "password": "test123456",
                "currency_preference": "USD"
            }
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login with demo credentials"""
        success, response = self.run_test(
            "User Login (Demo)",
            "POST",
            "auth/login",
            200,
            data={
                "email": "demo@smartbudget.com",
                "password": "demo123456"
            }
        )
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"   User ID: {self.user_id}")
            return True
        return False

    def test_get_user_profile(self):
        """Test getting user profile"""
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_account(self):
        """Test creating an account"""
        success, response = self.run_test(
            "Create Account",
            "POST",
            "accounts",
            200,
            data={
                "name": "Test Checking Account",
                "type": "checking",
                "balance": 1000.0,
                "currency": "USD",
                "bank_name": "Test Bank"
            }
        )
        if success and 'id' in response:
            self.account_id = response['id']
            print(f"   Account ID: {self.account_id}")
            return True
        return False

    def test_get_accounts(self):
        """Test getting accounts"""
        success, response = self.run_test(
            "Get Accounts",
            "GET",
            "accounts",
            200
        )
        return success

    def test_get_accounts_summary(self):
        """Test getting accounts summary"""
        success, response = self.run_test(
            "Get Accounts Summary",
            "GET",
            "accounts/summary",
            200
        )
        return success

    def test_create_transaction(self):
        """Test creating a transaction"""
        if not self.account_id:
            print("❌ Skipping transaction test - no account available")
            return False
            
        success, response = self.run_test(
            "Create Transaction (Expense)",
            "POST",
            "transactions",
            200,
            data={
                "account_id": self.account_id,
                "amount": 50.0,
                "category": "Food",
                "description": "Test grocery expense",
                "date": datetime.now().strftime('%Y-%m-%d'),
                "type": "expense",
                "currency": "USD"
            }
        )
        return success

    def test_create_income_transaction(self):
        """Test creating an income transaction"""
        if not self.account_id:
            print("❌ Skipping income test - no account available")
            return False
            
        success, response = self.run_test(
            "Create Transaction (Income)",
            "POST",
            "transactions",
            200,
            data={
                "account_id": self.account_id,
                "amount": 2000.0,
                "category": "Salary",
                "description": "Test salary",
                "date": datetime.now().strftime('%Y-%m-%d'),
                "type": "income",
                "currency": "USD"
            }
        )
        return success

    def test_get_transactions(self):
        """Test getting transactions"""
        success, response = self.run_test(
            "Get Transactions",
            "GET",
            "transactions",
            200
        )
        return success

    def test_get_transaction_stats(self):
        """Test getting transaction statistics"""
        success, response = self.run_test(
            "Get Transaction Stats",
            "GET",
            "transactions/stats",
            200
        )
        return success

    def test_nlp_expense_parsing(self):
        """Test NLP expense parsing"""
        success, response = self.run_test(
            "NLP Expense Parsing",
            "POST",
            "ai/parse-expense",
            200,
            data={
                "text": "Spent 100 on groceries yesterday"
            }
        )
        if success:
            print(f"   Parsed: {response}")
        return success

    def test_financial_profile(self):
        """Test AI financial profile"""
        success, response = self.run_test(
            "AI Financial Profile",
            "GET",
            "ai/financial-profile",
            200
        )
        if success:
            print(f"   Profile: {response.get('profile_type', 'N/A')}")
        return success

    def test_health_score(self):
        """Test AI health score"""
        success, response = self.run_test(
            "AI Health Score",
            "GET",
            "ai/health-score",
            200
        )
        if success:
            print(f"   Score: {response.get('score', 'N/A')}/100")
        return success

    def test_expense_prediction(self):
        """Test AI expense prediction"""
        success, response = self.run_test(
            "AI Expense Prediction",
            "GET",
            "ai/predict-expenses",
            200
        )
        if success:
            print(f"   Predicted Total: {response.get('predicted_total', 'N/A')}")
        return success

    def test_affordability_check(self):
        """Test AI affordability check"""
        success, response = self.run_test(
            "AI Affordability Check",
            "POST",
            "ai/afford-check",
            200,
            data={
                "item_name": "New iPhone",
                "price": 999.0,
                "currency": "USD"
            }
        )
        if success:
            print(f"   Status: {response.get('status', 'N/A')}")
        return success

    def test_budget_suggestions(self):
        """Test AI budget suggestions"""
        success, response = self.run_test(
            "AI Budget Suggestions",
            "POST",
            "ai/suggest-budget",
            200
        )
        if success:
            print(f"   Suggestions: {len(response.get('suggestions', []))}")
        return success

    def test_create_budget(self):
        """Test creating a budget"""
        success, response = self.run_test(
            "Create Budget",
            "POST",
            "budgets",
            200,
            data={
                "category": "Food",
                "monthly_limit": 500.0,
                "currency": "USD"
            }
        )
        return success

    def test_get_budgets(self):
        """Test getting budgets"""
        success, response = self.run_test(
            "Get Budgets",
            "GET",
            "budgets",
            200
        )
        return success

    def test_create_goal(self):
        """Test creating a goal"""
        deadline = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
        success, response = self.run_test(
            "Create Goal",
            "POST",
            "goals",
            200,
            data={
                "name": "Emergency Fund",
                "target_amount": 10000.0,
                "current_amount": 1000.0,
                "deadline": deadline,
                "currency": "USD"
            }
        )
        if success and 'id' in response:
            self.goal_id = response['id']
            return True
        return False

    def test_get_goals(self):
        """Test getting goals"""
        success, response = self.run_test(
            "Get Goals",
            "GET",
            "goals",
            200
        )
        return success

    def test_goal_risk_prediction(self):
        """Test AI goal risk prediction"""
        if not hasattr(self, 'goal_id'):
            print("❌ Skipping goal risk test - no goal available")
            return False
            
        success, response = self.run_test(
            "AI Goal Risk Prediction",
            "GET",
            f"ai/goal-risk/{self.goal_id}",
            200
        )
        if success:
            print(f"   Risk Status: {response.get('status', 'N/A')}")
        return success

    def test_get_alerts(self):
        """Test getting alerts"""
        success, response = self.run_test(
            "Get Alerts",
            "GET",
            "alerts",
            200
        )
        return success

    def test_currencies_endpoint(self):
        """Test currencies endpoint"""
        success, response = self.run_test(
            "Get Currencies",
            "GET",
            "currencies",
            200
        )
        if success:
            print(f"   Currencies: {len(response.get('currencies', []))}")
        return success

def main():
    print("🚀 Starting AI Budget Tracker API Tests")
    print("=" * 50)
    
    tester = AIBudgetTrackerTester()
    
    # Test basic endpoints first
    if not tester.test_currencies_endpoint():
        print("❌ Basic API connection failed")
        return 1
    
    # Test authentication flow
    print("\n📝 Testing Authentication...")
    if not tester.test_user_registration():
        print("❌ Registration failed, trying demo login...")
        if not tester.test_user_login():
            print("❌ Authentication completely failed")
            return 1
    
    if not tester.test_get_user_profile():
        print("❌ User profile test failed")
        return 1
    
    # Test account management
    print("\n🏦 Testing Account Management...")
    tester.test_create_account()
    tester.test_get_accounts()
    tester.test_get_accounts_summary()
    
    # Test transaction management
    print("\n💰 Testing Transaction Management...")
    tester.test_create_transaction()
    tester.test_create_income_transaction()
    tester.test_get_transactions()
    tester.test_get_transaction_stats()
    
    # Test AI features
    print("\n🤖 Testing AI Features...")
    tester.test_nlp_expense_parsing()
    tester.test_financial_profile()
    tester.test_health_score()
    tester.test_expense_prediction()
    tester.test_affordability_check()
    tester.test_budget_suggestions()
    
    # Test budget management
    print("\n📊 Testing Budget Management...")
    tester.test_create_budget()
    tester.test_get_budgets()
    
    # Test goal management
    print("\n🎯 Testing Goal Management...")
    tester.test_create_goal()
    tester.test_get_goals()
    tester.test_goal_risk_prediction()
    
    # Test alerts
    print("\n🔔 Testing Alerts...")
    tester.test_get_alerts()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results:")
    print(f"   Tests Run: {tester.tests_run}")
    print(f"   Tests Passed: {tester.tests_passed}")
    print(f"   Tests Failed: {tester.tests_run - tester.tests_passed}")
    print(f"   Success Rate: {(tester.tests_passed / tester.tests_run * 100):.1f}%")
    
    if tester.failed_tests:
        print(f"\n❌ Failed Tests:")
        for failed in tester.failed_tests:
            print(f"   - {failed}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())