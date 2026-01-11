import requests
import sys
import json
from datetime import datetime, timedelta

class MeuFluxoAPITester:
    def __init__(self, base_url="https://moneywise-125.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.created_transactions = []
        self.created_budget_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(str(response_data)) < 500:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list) and len(response_data) > 0:
                        print(f"   Response: List with {len(response_data)} items")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API", "GET", "api/", 200)

    def test_create_income_transaction(self):
        """Create an income transaction"""
        today = datetime.now().strftime("%Y-%m-%d")
        data = {
            "amount": 5000.0,
            "date": today,
            "type": "entrada",
            "category": "Salário",
            "description": "Salário mensal",
            "has_reminder": False
        }
        success, response = self.run_test("Create Income Transaction", "POST", "api/transactions", 200, data)
        if success and 'id' in response:
            self.created_transactions.append(response['id'])
        return success, response

    def test_create_expense_transaction(self):
        """Create an expense transaction with reminder"""
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        data = {
            "amount": 150.0,
            "date": tomorrow,
            "type": "saida",
            "category": "Alimentação",
            "description": "Compras do supermercado",
            "has_reminder": True
        }
        success, response = self.run_test("Create Expense Transaction (with reminder)", "POST", "api/transactions", 200, data)
        if success and 'id' in response:
            self.created_transactions.append(response['id'])
        return success, response

    def test_get_all_transactions(self):
        """Get all transactions"""
        return self.run_test("Get All Transactions", "GET", "api/transactions", 200)

    def test_update_transaction(self):
        """Update a transaction"""
        if not self.created_transactions:
            print("❌ No transactions to update")
            return False, {}
        
        transaction_id = self.created_transactions[0]
        data = {
            "amount": 5500.0,
            "description": "Salário mensal atualizado"
        }
        return self.run_test("Update Transaction", "PUT", f"api/transactions/{transaction_id}", 200, data)

    def test_get_single_transaction(self):
        """Get a single transaction by ID"""
        if not self.created_transactions:
            print("❌ No transactions to get")
            return False, {}
        
        transaction_id = self.created_transactions[0]
        return self.run_test("Get Single Transaction", "GET", f"api/transactions/{transaction_id}", 200)

    def test_delete_transaction(self):
        """Delete a transaction"""
        if len(self.created_transactions) < 2:
            print("❌ Not enough transactions to delete")
            return False, {}
        
        transaction_id = self.created_transactions.pop()  # Remove last one
        return self.run_test("Delete Transaction", "DELETE", f"api/transactions/{transaction_id}", 200)

    def test_week_stats(self):
        """Test weekly statistics"""
        success, response = self.run_test("Week Statistics", "GET", "api/stats/week", 200)
        if success:
            # Validate response structure
            required_fields = ['total_income', 'total_expense', 'balance', 'transactions']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in response: {field}")
                    return False, response
            print(f"   Income: R$ {response['total_income']:.2f}")
            print(f"   Expense: R$ {response['total_expense']:.2f}")
            print(f"   Balance: R$ {response['balance']:.2f}")
            print(f"   Transactions: {len(response['transactions'])}")
        return success, response

    def test_month_stats(self):
        """Test monthly statistics"""
        success, response = self.run_test("Month Statistics", "GET", "api/stats/month", 200)
        if success:
            print(f"   Income: R$ {response['total_income']:.2f}")
            print(f"   Expense: R$ {response['total_expense']:.2f}")
            print(f"   Balance: R$ {response['balance']:.2f}")
            print(f"   Transactions: {len(response['transactions'])}")
        return success, response

    def test_year_stats(self):
        """Test yearly statistics"""
        success, response = self.run_test("Year Statistics", "GET", "api/stats/year", 200)
        if success:
            print(f"   Income: R$ {response['total_income']:.2f}")
            print(f"   Expense: R$ {response['total_expense']:.2f}")
            print(f"   Balance: R$ {response['balance']:.2f}")
            print(f"   Transactions: {len(response['transactions'])}")
        return success, response

    def test_generate_tips(self):
        """Test AI tips generation"""
        data = {"period": "week"}
        success, response = self.run_test("Generate AI Tips", "POST", "api/tips", 200, data)
        if success:
            # Validate response structure
            if 'tips' not in response or 'stats' not in response:
                print("❌ Missing 'tips' or 'stats' in response")
                return False, response
            print(f"   Tips generated: {len(response['tips'])} characters")
            print(f"   Tips preview: {response['tips'][:100]}...")
        return success, response

    def test_get_reminders(self):
        """Test get pending reminders"""
        return self.run_test("Get Pending Reminders", "GET", "api/reminders", 200)

    def test_create_budget(self):
        """Create a budget for Alimentação category"""
        data = {
            "category": "Alimentação",
            "limit": 800.0,
            "period": "month"
        }
        success, response = self.run_test("Create Budget", "POST", "api/budgets", 200, data)
        if success and 'id' in response:
            self.created_budget_id = response['id']
        return success, response

    def test_get_budgets(self):
        """Get all budgets"""
        return self.run_test("Get All Budgets", "GET", "api/budgets", 200)

    def test_update_budget(self):
        """Update a budget limit"""
        if not hasattr(self, 'created_budget_id'):
            print("❌ No budget to update")
            return False, {}
        
        # The limit is passed as a query parameter, not in the body
        url = f"{self.base_url}/api/budgets/{self.created_budget_id}?limit=900.0"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing Update Budget...")
        print(f"   URL: {url}")
        
        try:
            response = requests.put(url, headers=headers, timeout=30)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"   Response: {response_data}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_delete_budget(self):
        """Delete a budget"""
        if not hasattr(self, 'created_budget_id'):
            print("❌ No budget to delete")
            return False, {}
        
        return self.run_test("Delete Budget", "DELETE", f"api/budgets/{self.created_budget_id}", 200)

    def test_categories_stats(self):
        """Test categories statistics with budgets"""
        success, response = self.run_test("Categories Statistics", "GET", "api/categories/stats", 200)
        if success:
            if isinstance(response, list):
                print(f"   Found {len(response)} categories with expenses")
                for category in response[:3]:  # Show first 3
                    print(f"   - {category.get('category', 'Unknown')}: R$ {category.get('total', 0):.2f} ({category.get('percentage', 0):.1f}%)")
                    if category.get('budget_limit'):
                        print(f"     Budget: R$ {category['budget_limit']:.2f}, Remaining: R$ {category.get('remaining', 0):.2f}")
            else:
                print("❌ Expected list response for categories stats")
                return False, response
        return success, response

    def test_period_comparison(self):
        """Test period comparison (current vs previous month)"""
        success, response = self.run_test("Period Comparison", "GET", "api/stats/comparison", 200)
        if success:
            # Validate response structure
            required_fields = ['current_period', 'previous_period', 'income_change', 'expense_change', 'balance_change']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in comparison response: {field}")
                    return False, response
            
            current = response['current_period']
            previous = response['previous_period']
            print(f"   Current Month - Income: R$ {current['total_income']:.2f}, Expense: R$ {current['total_expense']:.2f}")
            print(f"   Previous Month - Income: R$ {previous['total_income']:.2f}, Expense: R$ {previous['total_expense']:.2f}")
            print(f"   Changes - Income: {response['income_change']:.1f}%, Expense: {response['expense_change']:.1f}%")
        return success, response

    def test_csv_export(self):
        """Test CSV export functionality"""
        url = f"{self.base_url}/api/export/csv"
        headers = {'Content-Type': 'application/json'}
        
        self.tests_run += 1
        print(f"\n🔍 Testing CSV Export...")
        print(f"   URL: {url}")
        
        try:
            response = requests.get(url, headers=headers, timeout=30)
            success = response.status_code == 200
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Check if it's CSV content
                content_type = response.headers.get('content-type', '')
                if 'csv' in content_type or 'text' in content_type:
                    csv_content = response.text
                    lines = csv_content.split('\n')
                    if len(lines) > 0:
                        print(f"   CSV Headers: {lines[0]}")
                        print(f"   Total lines: {len(lines)}")
                        # Check for expected headers
                        expected_headers = ["Data", "Tipo", "Categoria", "Descrição", "Valor"]
                        if all(header in lines[0] for header in expected_headers):
                            print("   ✅ CSV headers are correct")
                        else:
                            print("   ⚠️ CSV headers may be incorrect")
                    return True, {"csv_lines": len(lines)}
                else:
                    print(f"   ⚠️ Unexpected content type: {content_type}")
                    return True, {}
            else:
                print(f"❌ Failed - Expected 200, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}
                
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

def main():
    print("🚀 Starting Meu Fluxo API Tests")
    print("=" * 50)
    
    tester = MeuFluxoAPITester()
    
    # Test sequence
    tests = [
        tester.test_root_endpoint,
        tester.test_create_income_transaction,
        tester.test_create_expense_transaction,
        tester.test_get_all_transactions,
        tester.test_update_transaction,
        tester.test_get_single_transaction,
        tester.test_week_stats,
        tester.test_month_stats,
        tester.test_year_stats,
        tester.test_generate_tips,
        tester.test_get_reminders,
        # New budget functionality tests
        tester.test_create_budget,
        tester.test_get_budgets,
        tester.test_update_budget,
        tester.test_categories_stats,
        tester.test_period_comparison,
        tester.test_csv_export,
        tester.test_delete_budget,
        tester.test_delete_transaction,
    ]
    
    # Run all tests
    for test in tests:
        try:
            test()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())