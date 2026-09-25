"""
AI Provider Abstraction for PayLoop

To connect a real LLM:
1. Subclass AIProvider
2. Implement all abstract methods
3. Set AI_PROVIDER env var to activate your provider

Currently active: MockAIProvider (works without any API key)

⚠️  Disclaimer: All outputs are educational insights only.
    Not financial, investment, or lending advice.
"""

from abc import ABC, abstractmethod
from typing import Any
import os


class AIProvider(ABC):
    """Abstract AI provider interface."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def is_mock(self) -> bool:
        pass

    @abstractmethod
    async def generate_insight(self, expense_data: dict) -> dict:
        """Generate spending insight for a student."""
        pass

    @abstractmethod
    async def chat(self, message: str, context: dict) -> str:
        """Answer a student's financial query from their own data."""
        pass

    @abstractmethod
    async def recommend_offers(self, student_data: dict, available_offers: list) -> list:
        """Recommend offers based on spending patterns."""
        pass

    @abstractmethod
    async def categorize_expense(self, description: str, amount: float) -> str:
        """Categorize an expense description into a standard category."""
        pass


class MockAIProvider(AIProvider):
    """
    Mock AI provider — V1 default.
    Works without any external API key.
    Returns intelligent rule-based responses.
    """

    provider_name = "MOCK"
    is_mock = True

    async def generate_insight(self, expense_data: dict) -> dict:
        current = expense_data.get("currentMonthTotal", 0)
        last = expense_data.get("lastMonthTotal", 0)
        categories = expense_data.get("categoryBreakdown", [])
        name = expense_data.get("studentName", "Student")
        count = expense_data.get("transactionCount", 0)
        points = expense_data.get("totalPoints", 0)

        top_cat = max(categories, key=lambda x: x.get("amount", 0), default=None)

        if last > 0:
            change = round(((current - last) / last) * 100)
            trend = f"{'📈' if change > 0 else '📉'} Your spending is {abs(change)}% {'higher' if change > 0 else 'lower'} than last month."
        else:
            trend = ""

        lines = [
            f"Hi {name}! Here's your personalized spending summary:",
            f"",
            f"💰 Total spent this month: ₹{current:.0f} across {count} transactions.",
        ]
        if trend:
            lines.append(f"")
            lines.append(trend)
        if top_cat:
            lines.append(f"")
            lines.append(f"🏆 Your largest spending category is **{top_cat['category']}** at ₹{top_cat['amount']:.0f}.")

        lines += [
            f"",
            f"💡 Tip: Check out active student offers to save on your next purchase!",
            f"",
            f"⚠️ This is an educational summary from demo activity. Not financial advice.",
        ]

        suggestions = [
            "Browse student food offers to save on meals",
            f"You have {points} Loop Points — consider redeeming them for coupons!",
            "Set a savings goal to track your progress toward your next big purchase"
        ]

        if top_cat and top_cat["category"] == "Food":
            suggestions.insert(0, "Consider using food offers this week to reduce spending")

        return {
            "title": "✨ Your AI Spending Insight",
            "content": "\n".join(lines),
            "suggestions": suggestions,
            "topCategory": top_cat["category"] if top_cat else "General",
            "disclaimer": "⚠️ Educational summary only. Not regulated financial advice.",
            "provider": self.provider_name,
            "isMock": self.is_mock
        }

    async def chat(self, message: str, context: dict) -> str:
        msg = message.lower()
        student_data = context.get("studentData", {})
        expenses = student_data.get("monthlyExpenses", [])
        total = student_data.get("totalMonthlySpend", 0)
        count = student_data.get("transactionCount", 0)
        points = student_data.get("totalPoints", 0)
        balance = student_data.get("demoBalance", 0)

        # Rule-based responses
        if any(w in msg for w in ["spend", "spent", "how much", "total"]):
            top = max(expenses, key=lambda x: x.get("amount", 0), default=None)
            reply = f"This month you've spent ₹{total:.0f} across {count} transactions."
            if top:
                reply += f" Your biggest category is {top['category']} at ₹{top['amount']:.0f}."
            return reply + "\n\n⚠️ This is demo data. Not financial advice."

        if any(w in msg for w in ["point", "reward", "loop"]):
            return f"You have {points} Loop Points! Redeem them in the Rewards section for coupons and discounts at participating merchants."

        if "balance" in msg:
            return f"Your demo balance is ₹{balance:.0f}. This is a simulated balance — no real money is involved."

        if any(w in msg for w in ["food", "cafe", "restaurant", "eat"]):
            food = next((e for e in expenses if e.get("category") == "Food"), None)
            if food:
                return f"You've spent ₹{food['amount']:.0f} on food this month. Check out our active food offers to save on your next meal!"
            return "I don't see food transactions this month yet. Check out our food offers in the Offers section!"

        if any(w in msg for w in ["save", "saving", "goal"]):
            return "Great mindset! You can save by:\n1. Using student offers (up to 25% off)\n2. Setting a savings goal in the Goals section\n3. Redeeming Loop Points for coupons\n\n⚠️ Educational tip only — not financial advice."

        if any(w in msg for w in ["offer", "deal", "discount"]):
            return "There are active student offers in the Offers section! Categories include Food, Shopping, Education, Entertainment, and Fitness."

        return (
            "I can help you understand your demo spending! Try asking:\n"
            "• \"Where did I spend the most this month?\"\n"
            "• \"How many Loop Points do I have?\"\n"
            "• \"What's my demo balance?\"\n"
            "• \"How can I save more?\"\n\n"
            "⚠️ I can only answer from your demo activity data."
        )

    async def recommend_offers(self, student_data: dict, available_offers: list) -> list:
        top_category = student_data.get("topCategory", "Food")
        # Filter offers matching the top category
        relevant = [o for o in available_offers if top_category.lower() in str(o).lower()]
        return relevant[:6] if relevant else available_offers[:6]

    async def categorize_expense(self, description: str, amount: float) -> str:  # noqa: ARG002
        desc = description.lower()
        if any(w in desc for w in ["cafe", "coffee", "pizza", "restaurant", "food", "dosa", "juice", "meal"]):
            return "Food"
        if any(w in desc for w in ["book", "stationery", "library", "course", "tuition"]):
            return "Education"
        if any(w in desc for w in ["gym", "fitness", "yoga", "sport"]):
            return "Fitness"
        if any(w in desc for w in ["movie", "cinema", "game", "concert", "event"]):
            return "Entertainment"
        if any(w in desc for w in ["bus", "metro", "train", "auto", "cab", "travel"]):
            return "Travel"
        if any(w in desc for w in ["print", "laundry", "salon", "shop", "mall", "cloth"]):
            return "Shopping"
        return "Other"


def get_ai_provider() -> AIProvider:
    """
    Factory — returns the active AI provider.

    FUTURE INTEGRATION:
    if os.getenv("AI_PROVIDER") == "openai":
        return OpenAIProvider(api_key=os.getenv("AI_API_KEY"))
    if os.getenv("AI_PROVIDER") == "gemini":
        return GeminiProvider(api_key=os.getenv("AI_API_KEY"))
    """
    return MockAIProvider()
