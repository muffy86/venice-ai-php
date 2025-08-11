# 🚀 Amazon Q Enhanced Demo - Advanced User Management System
# TODO: Place your cursor at the end of any line and press Enter for Amazon Q suggestions
# TIP: Press Tab to accept, Ctrl+→ for word-by-word, Esc to dismiss

"""
Amazon Q Optimization Features:
- Type hints for better suggestions
- Common patterns for AI completion
- Well-documented functions
- Modern Python practices
"""

from typing import List, Dict, Optional, Union, Tuple
from dataclasses import dataclass, field
from datetime import datetime
import json
import uuid

@dataclass
class User:
    """Enhanced User class with type hints for better Amazon Q suggestions"""
    name: str
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    city: str = ""
    state: str = ""
    email: Optional[str] = None
    phone: Optional[str] = None
    created_at: datetime = field(default_factory=datetime.now)
    is_active: bool = True
    tags: List[str] = field(default_factory=list)
    
    def __post_init__(self):
        """Auto-generate email if not provided"""
        if self.email is None:
            clean_name = self.name.lower().replace(' ', '.')
            self.email = f"{clean_name}@example.com"
    
    def to_dict(self) -> Dict:
        """Convert user to dictionary"""
        return {
            'name': self.name,
            'id': self.id,
            'city': self.city,
            'state': self.state,
            'email': self.email,
            'phone': self.phone,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active,
            'tags': self.tags
        }

fake_users = [
    { "name": "User 1", "id": "user1", "city": "San Francisco", "state": "CA" },
    { "name": "Alice Johnson", "id": "user2", "city": "New York", "state": "NY" },
    { "name": "Bob Smith", "id": "user3", "city": "Los Angeles", "state": "CA" },
    { "name": "Carol Davis", "id": "user4", "city": "Chicago", "state": "IL" },
    { "name": "David Wilson", "id": "user5", "city": "Houston", "state": "TX" },
    { "name": "Eva Martinez", "id": "user6", "city": "Phoenix", "state": "AZ" },
    { "name": "Frank Brown", "id": "user7", "city": "Philadelphia", "state": "PA" },
    { "name": "Grace Lee", "id": "user8", "city": "San Antonio", "state": "TX" },
    { "name": "Henry Taylor", "id": "user9", "city": "San Diego", "state": "CA" },
    { "name": "Ivy Chen", "id": "user10", "city": "Dallas", "state": "TX" }
]

def get_user_by_id(user_id):
    """Find a user by their ID"""
    for user in fake_users:
        if user["id"] == user_id:
            return user
    return None

def get_users_by_state(state):
    """Get all users from a specific state"""
    return [user for user in fake_users if user["state"] == state]

def get_users_by_city(city):
    """Get all users from a specific city"""
    return [user for user in fake_users if user["city"] == city]

def add_user(name, user_id, city, state):
    """Add a new user to the list"""
    new_user = {
        "name": name,
        "id": user_id,
        "city": city,
        "state": state
    }
    fake_users.append(new_user)
    return new_user

def display_all_users():
    """Display all users in a formatted way"""
    print("All Users:")
    print("-" * 50)
    for user in fake_users:
        print(f"ID: {user['id']:<8} | Name: {user['name']:<15} | City: {user['city']:<15} | State: {user['state']}")

def get_user_count_by_state():
    """Get count of users by state"""
    state_counts = {}
    for user in fake_users:
        state = user["state"]
        state_counts[state] = state_counts.get(state, 0) + 1
    return state_counts

# Example usage
if __name__ == "__main__":
    print("🚀 User Management System")
    print("=" * 30)
    
    # Display all users
    display_all_users()
    
    print("\n📍 Users from California:")
    ca_users = get_users_by_state("CA")
    for user in ca_users:
        print(f"  • {user['name']} from {user['city']}")
    
    print("\n📊 User count by state:")
    state_counts = get_user_count_by_state()
    for state, count in state_counts.items():
        print(f"  {state}: {count} users")
    
    print("\n🔍 Looking up user2:")
    user = get_user_by_id("user2")
    if user:
        print(f"  Found: {user['name']} from {user['city']}, {user['state']}")
    
    print("\n✅ All functions working correctly!")