from typing import List, Dict, Optional, Union, Tuple
import json

# User class to represent individual user data
class User:
    """User data model"""
    
    def __init__(self, name: str, city: str, state: str, email: Optional[str] = None):
        self.name = name
        self.city = city
        self.state = state
        self.email = email
    
    def to_dict(self) -> Dict:
        """Convert user to dictionary format"""
        return {
            "name": self.name,
            "city": self.city,
            "state": self.state,
            "email": self.email
        }

# Enhanced UserManager class for better Amazon Q suggestions
class UserManager:
    """Advanced user management with Amazon Q optimization patterns"""
    
    def __init__(self):
        self.users: List[Dict] = []
        self.load_sample_data()
    
    def load_sample_data(self):
        """Load sample users - Amazon Q will suggest more when cursor is placed here"""
        sample_users = [
            {"name": "Alice Johnson", "city": "New York", "state": "NY", "email": "alice@example.com"},
            {"name": "Bob Smith", "city": "Los Angeles", "state": "CA", "email": "bob@example.com"},
            {"name": "Carol Davis", "city": "Chicago", "state": "IL", "email": "carol@example.com"},
            # Amazon Q will suggest more users here when you press Enter
        ]
        for user_data in sample_users:
            self.add_user(**user_data)
    
    def add_user(self, name: str, city: str, state: str, email: Optional[str] = None) -> User:
        """Add a new user - Amazon Q will suggest parameter validation"""
        # Amazon Q will suggest validation logic here
        user = User(
            name=name,
            city=city,
            state=state,
            email=email
        )
        self.users.append(user.to_dict())
        return user
    
    def find_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Find user by ID - Amazon Q will suggest error handling"""
        # Amazon Q will suggest implementation here
        
    def find_users_by_state(self, state: str) -> List[Dict]:
        """Find all users in a state - Amazon Q will suggest filtering logic"""
        # Amazon Q will suggest list comprehension or filter logic
        
    def find_users_by_city(self, city: str) -> List[Dict]:
        """Find users by city - Amazon Q will suggest case-insensitive search"""
        # Amazon Q will suggest implementation
        
    def get_user_stats(self) -> Dict[str, Union[int, Dict]]:
        """Get user statistics - Amazon Q will suggest aggregation logic"""
        # Amazon Q will suggest statistical calculations
        
    def export_users_to_json(self, filename: str) -> bool:
        """Export users to JSON file - Amazon Q will suggest file operations"""
        # Amazon Q will suggest try/catch and file writing
        
    def import_users_from_json(self, filename: str) -> bool:
        """Import users from JSON - Amazon Q will suggest error handling"""
        # Amazon Q will suggest file reading and validation
        
    def search_users(self, query: str) -> List[Dict]:
        """Search users by name, city, or email - Amazon Q will suggest search logic"""
        # Amazon Q will suggest fuzzy search or regex patterns
        
    def update_user(self, user_id: str, **kwargs) -> bool:
        """Update user information - Amazon Q will suggest field validation"""
        # Amazon Q will suggest update logic
        
    def delete_user(self, user_id: str) -> bool:
        """Delete user by ID - Amazon Q will suggest confirmation logic"""
        # Amazon Q will suggest safe deletion

# Amazon Q Demo Functions - Place cursor after each function signature for suggestions
def process_user_data(users: List[Dict]) -> Dict:
    """Process user data for analytics - Amazon Q will suggest data processing"""
    # Amazon Q will suggest data transformation logic
    pass

def generate_user_report(users: List[Dict], format: str = "text") -> str:
    """Generate user report - Amazon Q will suggest report formatting"""
    # Amazon Q will suggest report generation logic
    pass

def validate_user_data(user_data: Dict) -> Tuple[bool, List[str]]:
    """Validate user data - Amazon Q will suggest validation rules"""
    # Amazon Q will suggest validation patterns
    pass

def bulk_import_users(file_path: str) -> Tuple[int, List[str]]:
    """Bulk import users from file - Amazon Q will suggest file processing"""
    # Amazon Q will suggest CSV/JSON parsing logic
    pass

# Usage examples for Amazon Q to learn from
if __name__ == "__main__":
    # Initialize user manager
    manager = UserManager()
    
    # Amazon Q will suggest more usage examples here
    print("🚀 Amazon Q Enhanced User Management System")
    print(f"Total users: {len(manager.users)}")
    
    # Test functions - Amazon Q will suggest more test cases
    # Place cursor at the end of lines and press Enter for suggestions