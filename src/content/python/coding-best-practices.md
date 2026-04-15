---
title: "Coding Best Practices"
category: "python"
subcategory: "coding-best-practices"
tags: []
updated: "2026-04-16"
---

# Python Developer Playbook
## Complete Guide to Production-Grade Code
### Topics: If Conditions, Loops, Functions, Decorators, Logging, Exception Handling, OOP, SOLID, Design Patterns

---

## 1. IF CONDITIONS

### Short Explanation
If conditions control program flow based on boolean evaluations. They're the foundation of decision-making in code.

### Best Practices for Production

#### Practice 1: Guard Clauses Over Deep Nesting
```python
# ❌ ANTI-PATTERN: Deep nesting (hard to read, maintain)
def process_user(user, request, config):
    if user:
        if user.is_active:
            if request.is_valid():
                if config.get("enable_processing"):
                    return handle_user(user)
    return None

# ✓ PRODUCTION PATTERN: Guard clauses (early return)
def process_user(user, request, config):
    """Process user with clear exit points."""
    if not user:
        logger.warning("No user provided")
        return None
    
    if not user.is_active:
        logger.info(f"User {user.id} inactive")
        return None
    
    if not request.is_valid():
        logger.warning("Invalid request")
        return None
    
    if not config.get("enable_processing"):
        logger.info("Processing disabled in config")
        return None
    
    # Main logic is clear and unindented
    return handle_user(user)
```

#### Practice 2: Use Enums Instead of Magic Strings
```python
# ❌ ANTI-PATTERN: String comparisons (typo-prone, unclear)
def handle_order_status(status):
    if status == "pending":
        send_confirmation()
    elif status == "processing":
        notify_warehouse()
    elif status == "shipped":
        notify_customer()
    elif status == "delivered":
        send_review_request()
    else:
        log_unknown_status(status)

# ✓ PRODUCTION PATTERN: Enums (type-safe, self-documenting)
from enum import Enum

class OrderStatus(Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SHIPPED = "shipped"
    DELIVERED = "delivered"

def handle_order_status(status: OrderStatus):
    """Handle order based on status."""
    status_handlers = {
        OrderStatus.PENDING: send_confirmation,
        OrderStatus.PROCESSING: notify_warehouse,
        OrderStatus.SHIPPED: notify_customer,
        OrderStatus.DELIVERED: send_review_request,
    }
    handler = status_handlers.get(status)
    if handler:
        handler()
```

#### Practice 3: Dictionary Dispatch for Multiple Cases
```python
# ❌ ANTI-PATTERN: Long if-elif chains
def execute_command(command, args):
    if command == "start":
        start_service(args)
    elif command == "stop":
        stop_service(args)
    elif command == "restart":
        restart_service(args)
    elif command == "status":
        show_status(args)
    elif command == "logs":
        show_logs(args)
    # ... 50 more commands

# ✓ PRODUCTION PATTERN: Dictionary dispatch
command_handlers = {
    "start": start_service,
    "stop": stop_service,
    "restart": restart_service,
    "status": show_status,
    "logs": show_logs,
}

def execute_command(command: str, args):
    """Execute command with O(1) lookup."""
    handler = command_handlers.get(command)
    if handler is None:
        raise ValueError(f"Unknown command: {command}")
    return handler(args)
```

#### Practice 4: Meaningful Conditions, Not Implicit Truthiness
```python
# ❌ ANTI-PATTERN: Ambiguous truthiness checks
def process_items(items):
    if items:  # Does this mean non-empty or non-None?
        for item in items:
            process(item)

# ✓ PRODUCTION PATTERN: Explicit intent
def process_items(items: Optional[List[Item]]):
    """Process items if provided and non-empty."""
    if items is None:
        logger.debug("No items provided")
        return
    
    if len(items) == 0:
        logger.info("Empty items list")
        return
    
    for item in items:
        process(item)
```

#### Practice 5: Use Membership Testing Efficiently
```python
# ❌ ANTI-PATTERN: Repeated conditions
if status == "active" or status == "processing" or status == "pending":
    allow_modification()

# ✓ PRODUCTION PATTERN: Membership with set
MODIFIABLE_STATUSES = {"active", "processing", "pending"}

if status in MODIFIABLE_STATUSES:
    allow_modification()
```

### Real-Life Anti-Patterns to Avoid

#### Anti-Pattern 1: Comparing Booleans (Wastes Readability)
```python
# ❌ In a real system, you'll see this everywhere
if is_valid == True:  # Redundant
if is_active == False:  # Confusing

# ✓ What you should write
if is_valid:
if not is_active:
```

#### Anti-Pattern 2: Silent Failures in Production
```python
# ❌ REAL PROBLEM: Function returns None silently
def get_user_email(user_id):
    user = db.get_user(user_id)
    if user:
        return user.email  # What if email is None?
    # Returns None implicitly!

# Email sending fails later with cryptic error
if email:  # This might be True even if get_user_email returned None!
    send_email(email)

# ✓ PRODUCTION FIX: Be explicit about failures
def get_user_email(user_id: int) -> str:
    """Get user email, raising if not found."""
    user = db.get_user(user_id)
    if user is None:
        raise ValueError(f"User {user_id} not found")
    if not user.email:
        raise ValueError(f"User {user_id} has no email")
    return user.email
```

#### Anti-Pattern 3: Fragile State Checks (Common in Legacy Code)
```python
# ❌ REAL PROBLEM: State can change between checks
if user.has_permission("delete"):  # Check
    # ... 10 lines of code
    user.delete_resource(resource_id)  # Act - but permissions might've changed!

# ✓ PRODUCTION FIX: Atomic operations or re-validation
def delete_resource(user: User, resource_id: int):
    """Delete resource with atomic permission check."""
    # Check and act in one place
    if not user.has_permission("delete"):
        raise PermissionError(f"User {user.id} cannot delete")
    
    # Or use database-level constraints
    result = db.delete_where(
        resource_id=resource_id,
        user_id=user.id,
        user_has_permission=True
    )
    if result.rows_affected == 0:
        raise PermissionError("Resource not found or no permission")
```

---

## 2. LOOPS (FOR & WHILE)

### Short Explanation
Loops repeat code blocks: `for` iterates over collections, `while` runs while a condition is true.

### Best Practices for Production

#### Practice 1: Prefer For Loops Over While (When Possible)
```python
# ❌ ANTI-PATTERN: Manual indexing with while (error-prone)
items = [1, 2, 3, 4, 5]
i = 0
results = []
while i < len(items):
    results.append(items[i] * 2)
    i += 1  # Easy to forget or duplicate

# ✓ PRODUCTION PATTERN: For loop (Pythonic, safer)
items = [1, 2, 3, 4, 5]
results = [item * 2 for item in items]
```

#### Practice 2: Use List Comprehensions for Transformations
```python
# ❌ ANTI-PATTERN: Verbose loop for simple transformation
users = get_users()
user_ids = []
for user in users:
    if user.is_active:
        user_ids.append(user.id)

# ✓ PRODUCTION PATTERN: Concise comprehension
user_ids = [user.id for user in users if user.is_active]

# For complex logic, still use comprehension
orders_data = [
    {
        "id": order.id,
        "total": order.total,
        "discount": order.total * 0.1 if order.customer.is_vip else 0
    }
    for order in orders
    if order.status == OrderStatus.COMPLETED
]
```

#### Practice 3: Avoid Mutable Default Arguments in Loops
```python
# ❌ ANTI-PATTERN: Mutable default argument across iterations
def append_item(item, items=[]):
    items.append(item)
    return items

result1 = append_item("a")  # ["a"]
result2 = append_item("b")  # ["a", "b"] - SHARED LIST!

# ✓ PRODUCTION PATTERN: None default
def append_item(item, items=None):
    if items is None:
        items = []
    items.append(item)
    return items
```

#### Practice 4: Use enumerate() for Index + Value
```python
# ❌ ANTI-PATTERN: Manual index tracking
items = ["apple", "banana", "orange"]
for i in range(len(items)):
    print(f"{i}: {items[i]}")

# ✓ PRODUCTION PATTERN: enumerate()
for i, item in enumerate(items, start=1):
    print(f"{i}: {item}")
```

#### Practice 5: Use zip() for Parallel Iteration
```python
# ❌ ANTI-PATTERN: Index-based parallel access
names = ["Alice", "Bob", "Charlie"]
ages = [25, 30, 35]
for i in range(len(names)):
    print(f"{names[i]} is {ages[i]}")

# ✓ PRODUCTION PATTERN: zip()
for name, age in zip(names, ages):
    print(f"{name} is {age}")

# Multiple iterables
for name, age, city in zip(names, ages, ["NYC", "LA", "SF"]):
    print(f"{name}, {age}, {city}")
```

#### Practice 6: Know When to Use While
```python
# ✓ APPROPRIATE: Retry logic (condition-based, not iteration-based)
max_retries = 3
retry_count = 0
while retry_count < max_retries:
    try:
        result = call_external_api()
        break  # Success
    except ConnectionError:
        retry_count += 1
        if retry_count >= max_retries:
            raise
        sleep(2 ** retry_count)  # Exponential backoff

# ✓ APPROPRIATE: Read until condition
while True:
    line = file.readline()
    if not line:  # EOF
        break
    process_line(line)
```

### Real-Life Anti-Patterns to Avoid

#### Anti-Pattern 1: Loop Body That's Too Complex
```python
# ❌ REAL PROBLEM: Loop does too much, hard to test
for order in orders:
    # Validation
    if not order.customer:
        log_error(order.id)
        continue
    
    # Processing
    total = 0
    for item in order.items:
        total += item.price * item.quantity
    
    # Discount calculation
    if order.customer.is_vip:
        total *= 0.9
    
    # Database update
    db.update_order(order.id, total=total)
    
    # Email notification
    send_email(order.customer.email, f"Total: {total}")

# ✓ PRODUCTION FIX: Extract to function
for order in orders:
    try:
        process_order(order)
    except ProcessingError as e:
        logger.error(f"Failed to process order {order.id}: {e}")

def process_order(order: Order) -> None:
    """Process single order (testable, reusable)."""
    validate_order(order)
    total = calculate_total(order)
    update_in_database(order, total)
    notify_customer(order, total)
```

#### Anti-Pattern 2: Breaking Out of Nested Loops (Confusing)
```python
# ❌ ANTI-PATTERN: Hard to trace what breaks
found = False
for user in users:
    for order in user.orders:
        if order.id == target_id:
            found = True
            break
    if found:
        break

# ✓ PRODUCTION PATTERN: Extract to function
def find_order(users, target_id):
    """Find order by ID."""
    for user in users:
        for order in user.orders:
            if order.id == target_id:
                return order
    return None

# Or use any() with generator
def find_order_functional(users, target_id):
    """Functional approach."""
    return next(
        (order for user in users for order in user.orders if order.id == target_id),
        None
    )
```

#### Anti-Pattern 3: Modifying Collection While Iterating
```python
# ❌ ANTI-PATTERN: Modifying list while iterating (undefined behavior)
users = [User("alice"), User("bob"), User("charlie")]
for user in users:
    if user.is_inactive:
        users.remove(user)  # DANGER! Skips items

# ✓ PRODUCTION PATTERN: Iterate over copy or use filter
# Method 1: Iterate over copy
for user in users[:]:  # Copy with [:]
    if user.is_inactive:
        users.remove(user)

# Method 2: Filter (better)
active_users = [u for u in users if not u.is_inactive]

# Method 3: Remove with condition
users = [u for u in users if u.is_active]
```

#### Anti-Pattern 4: Expensive Operations in Loop Condition
```python
# ❌ ANTI-PATTERN: Recalculating expensive operation every iteration
while has_pending_jobs():  # Called 1000 times!
    job = get_next_job()
    process(job)

# ✓ PRODUCTION PATTERN: Calculate once
has_jobs = has_pending_jobs()
while has_jobs:
    job = get_next_job()
    process(job)
    has_jobs = has_pending_jobs()  # Update once per iteration
```

#### Anti-Pattern 5: Silent Loop Failures
```python
# ❌ ANTI-PATTERN: Loop continues on errors (data loss)
for item_id in item_ids:
    try:
        process_item(item_id)
    except Exception:
        pass  # Silent failure!

# ✓ PRODUCTION PATTERN: Log and decide
failed_items = []
for item_id in item_ids:
    try:
        process_item(item_id)
    except ProcessingError as e:
        logger.error(f"Failed to process item {item_id}: {e}")
        failed_items.append(item_id)

if failed_items:
    logger.critical(f"Failed items: {failed_items}")
    raise ProcessingError(f"Could not process {len(failed_items)} items")
```

---

## 3. FUNCTIONS

### Short Explanation
Functions are reusable blocks of code that take inputs (parameters) and return outputs. They're the building blocks of production code.

### Best Practices for Production

#### Practice 1: Single Responsibility Principle (One Thing Per Function)
```python
# ❌ ANTI-PATTERN: Function does too much
def process_user_order(user_id, order_data):
    # Fetch user
    user = db.get_user(user_id)
    if not user:
        return {"error": "User not found"}
    
    # Validate order
    if not order_data.get("items"):
        return {"error": "No items"}
    
    # Calculate total
    total = sum(item["price"] * item["qty"] for item in order_data["items"])
    if total < 0:
        return {"error": "Invalid total"}
    
    # Apply discount
    if user.is_vip:
        total *= 0.9
    
    # Save to DB
    order = Order(user_id=user_id, total=total)
    db.save(order)
    
    # Send email
    send_confirmation_email(user.email)
    
    return {"success": True, "order_id": order.id}

# ✓ PRODUCTION PATTERN: Small, focused functions
def process_user_order(user_id: int, order_data: dict) -> OrderResult:
    """Process user order (orchestration function)."""
    user = get_and_validate_user(user_id)
    validate_order_data(order_data)
    
    total = calculate_order_total(order_data)
    total = apply_discount(user, total)
    
    order = save_order(user, total)
    notify_customer(user, order)
    
    return OrderResult(success=True, order_id=order.id)

def calculate_order_total(order_data: dict) -> float:
    """Calculate order total (single responsibility)."""
    total = sum(item["price"] * item["qty"] for item in order_data["items"])
    if total < 0:
        raise ValueError("Invalid total calculated")
    return total

def apply_discount(user: User, total: float) -> float:
    """Apply user discount (single responsibility)."""
    if user.is_vip:
        return total * 0.9
    return total
```

#### Practice 2: Use Type Hints Everywhere
```python
# ❌ ANTI-PATTERN: No types (unclear, runtime errors)
def process_items(items, filter_fn=None, limit=10):
    result = []
    for item in items:
        if filter_fn is None or filter_fn(item):
            result.append(item)
        if len(result) >= limit:
            break
    return result

# ✓ PRODUCTION PATTERN: Full type annotations
from typing import List, Optional, Callable

def process_items(
    items: List[Item],
    filter_fn: Optional[Callable[[Item], bool]] = None,
    limit: int = 10
) -> List[Item]:
    """Process items with optional filtering.
    
    Args:
        items: List of items to process
        filter_fn: Optional filter function
        limit: Maximum items to return
    
    Returns:
        Filtered items list (max length: limit)
    """
    result = []
    for item in items:
        if filter_fn is None or filter_fn(item):
            result.append(item)
        if len(result) >= limit:
            break
    return result
```

#### Practice 3: Default Arguments - Be Careful with Mutables
```python
# ❌ ANTI-PATTERN: Mutable default (shared across calls)
def add_user(name: str, roles: List[str] = []):
    """Add user with roles."""
    roles.append("user")  # Modifies default!
    return User(name=name, roles=roles)

user1 = add_user("alice")      # roles = ["user"]
user2 = add_user("bob")        # roles = ["user", "user"] - SHARED!

# ✓ PRODUCTION PATTERN: Use None as sentinel
def add_user(name: str, roles: Optional[List[str]] = None) -> User:
    """Add user with roles."""
    if roles is None:
        roles = []
    roles.append("user")
    return User(name=name, roles=roles)

# Or use dataclass
from dataclasses import dataclass, field

@dataclass
class User:
    name: str
    roles: List[str] = field(default_factory=list)
```

#### Practice 4: Return Meaningful Values or Raise Exceptions
```python
# ❌ ANTI-PATTERN: Silent failures (return None)
def get_user_email(user_id: int) -> Optional[str]:
    """Get user email (returns None on failure - silent)."""
    user = db.get_user(user_id)
    if user:
        return user.email
    return None  # Caller doesn't know WHY it's None

# Later in code:
email = get_user_email(123)
if email:  # Might be None for many reasons!
    send_email(email)

# ✓ PRODUCTION PATTERN: Raise exceptions (fail fast)
def get_user_email(user_id: int) -> str:
    """Get user email (raises on failure - clear failure point)."""
    user = db.get_user(user_id)
    if not user:
        raise UserNotFoundError(f"User {user_id} not found")
    if not user.email:
        raise UserDataError(f"User {user_id} has no email")
    return user.email

# Caller knows the function always returns a valid email
email = get_user_email(123)
send_email(email)
```

#### Practice 5: Use *args and **kwargs Carefully
```python
# ❌ ANTI-PATTERN: Unclear what arguments are accepted
def log_event(event_type, *args, **kwargs):
    """Log event - what are args and kwargs?"""
    message = args[0] if args else "No message"
    user_id = kwargs.get("user_id")
    # Hard to understand, hard to test

# ✓ PRODUCTION PATTERN: Explicit parameters
def log_event(
    event_type: str,
    message: str,
    user_id: Optional[int] = None,
    metadata: Optional[dict] = None
) -> None:
    """Log event with clear parameters."""
    logger.info(
        f"Event: {event_type}",
        extra={
            "message": message,
            "user_id": user_id,
            "metadata": metadata or {}
        }
    )

# Use *args/**kwargs only when truly variable
def create_query_params(*filters: str, **options: any) -> dict:
    """Build query with variable filters and options.
    
    Args:
        *filters: Variable filter strings
        **options: Named options (limit, offset, etc)
    """
    return {"filters": filters, **options}
```

### Real-Life Anti-Patterns to Avoid

#### Anti-Pattern 1: Functions That Modify Input (Side Effects)
```python
# ❌ ANTI-PATTERN: Caller doesn't expect modification
def process_order_items(items: List[dict]) -> float:
    """Calculate total and modify items (side effect)."""
    total = 0
    for item in items:
        item["processed"] = True  # Caller's list modified!
        total += item["price"] * item["qty"]
    return total

items = [{"price": 10, "qty": 2}, {"price": 20, "qty": 1}]
total = process_order_items(items)
# Now items is modified! Caller might not expect this.

# ✓ PRODUCTION PATTERN: No modifications (pure functions)
def calculate_order_total(items: List[dict]) -> float:
    """Calculate total without side effects."""
    return sum(item["price"] * item["qty"] for item in items)

def mark_items_processed(items: List[dict]) -> List[dict]:
    """Return new list with processed flag (no mutation)."""
    return [
        {**item, "processed": True}
        for item in items
    ]

items = [{"price": 10, "qty": 2}]
total = calculate_order_total(items)
items = mark_items_processed(items)  # Explicit return
```

#### Anti-Pattern 2: Functions That Are Too Generic
```python
# ❌ ANTI-PATTERN: Try to be too flexible (unclear purpose)
def transform(data, transform_fn=None, filter_fn=None, sort_fn=None):
    """Transform data in various ways (what does this DO?)."""
    if filter_fn:
        data = [x for x in data if filter_fn(x)]
    if transform_fn:
        data = [transform_fn(x) for x in data]
    if sort_fn:
        data = sorted(data, key=sort_fn)
    return data

# Usage is unclear
result = transform(users, transform_fn=lambda u: u.name)

# ✓ PRODUCTION PATTERN: Specific, clear functions
def get_user_names(users: List[User]) -> List[str]:
    """Get list of user names."""
    return [user.name for user in users]

def get_active_users(users: List[User]) -> List[User]:
    """Get only active users."""
    return [u for u in users if u.is_active]

def sort_users_by_name(users: List[User]) -> List[User]:
    """Sort users alphabetically by name."""
    return sorted(users, key=lambda u: u.name)

# Usage is crystal clear
active_names = get_user_names(get_active_users(users))
```

#### Anti-Pattern 3: Global State in Functions
```python
# ❌ ANTI-PATTERN: Hidden dependency on global
cache = {}

def get_user(user_id: int) -> User:
    """Get user (uses hidden global cache)."""
    if user_id in cache:
        return cache[user_id]
    
    user = db.get_user(user_id)
    cache[user_id] = user
    return user

# Problems: Hard to test, unpredictable behavior, thread-unsafe

# ✓ PRODUCTION PATTERN: Pass dependencies explicitly
def get_user(user_id: int, cache: dict, db: Database) -> User:
    """Get user with explicit dependencies."""
    if user_id in cache:
        return cache[user_id]
    
    user = db.get_user(user_id)
    cache[user_id] = user
    return user

# Better: Use dependency injection
class UserRepository:
    def __init__(self, db: Database, cache: Cache):
        self.db = db
        self.cache = cache
    
    def get_user(self, user_id: int) -> User:
        """Get user with injected dependencies."""
        if cached := self.cache.get(user_id):
            return cached
        
        user = self.db.get_user(user_id)
        self.cache.set(user_id, user)
        return user
```

---

## 4. DECORATORS

### Short Explanation
Decorators wrap functions to modify their behavior without changing the original function. Common use: logging, caching, authentication, timing.

### Best Practices for Production

#### Practice 1: Simple Decorator for Logging
```python
from functools import wraps
import time
from typing import Callable

# ✓ PRODUCTION PATTERN: Decorator with logging
def log_execution(func: Callable) -> Callable:
    """Log function execution (entry, exit, duration)."""
    @wraps(func)  # Preserves original function metadata
    def wrapper(*args, **kwargs):
        logger.info(f"Calling {func.__name__} with args={args}, kwargs={kwargs}")
        start = time.time()
        try:
            result = func(*args, **kwargs)
            duration = time.time() - start
            logger.info(f"{func.__name__} returned {result} in {duration:.3f}s")
            return result
        except Exception as e:
            logger.error(f"{func.__name__} raised {type(e).__name__}: {e}")
            raise
    return wrapper

@log_execution
def process_user(user_id: int) -> User:
    """Process user."""
    return db.get_user(user_id)

# Output:
# INFO: Calling process_user with args=(1,), kwargs={}
# INFO: process_user returned User(...) in 0.045s
```

#### Practice 2: Decorator for Caching Results
```python
from functools import wraps, lru_cache

# ✓ PRODUCTION PATTERN: Simple caching decorator
def cache_result(func: Callable) -> Callable:
    """Cache function result."""
    cache = {}
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        # Create cache key from arguments
        key = (args, tuple(sorted(kwargs.items())))
        
        if key in cache:
            logger.debug(f"{func.__name__} cache hit for {key}")
            return cache[key]
        
        result = func(*args, **kwargs)
        cache[key] = result
        return result
    
    # Add method to clear cache
    wrapper.cache_clear = lambda: cache.clear()
    return wrapper

@cache_result
def expensive_computation(n: int) -> int:
    """Compute expensive result."""
    time.sleep(1)  # Simulate expensive operation
    return n * n

result1 = expensive_computation(5)  # Takes 1 second
result2 = expensive_computation(5)  # Returns instantly from cache
expensive_computation.cache_clear()  # Clear cache

# Built-in caching: @lru_cache
@lru_cache(maxsize=128)
def fibonacci(n: int) -> int:
    """Fibonacci with LRU cache."""
    if n < 2:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

#### Practice 3: Decorator for Exception Handling
```python
# ✓ PRODUCTION PATTERN: Retry decorator
def retry(max_attempts: int = 3, delay: float = 1.0):
    """Retry decorator with exponential backoff."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    if attempt == max_attempts - 1:
                        logger.error(f"{func.__name__} failed after {max_attempts} attempts")
                        raise
                    
                    wait_time = delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(
                        f"{func.__name__} attempt {attempt + 1} failed: {e}. "
                        f"Retrying in {wait_time}s..."
                    )
                    time.sleep(wait_time)
        return wrapper
    return decorator

@retry(max_attempts=3, delay=0.5)
def call_external_api(url: str) -> dict:
    """Call API with automatic retry."""
    response = requests.get(url, timeout=5)
    response.raise_for_status()
    return response.json()
```

#### Practice 4: Decorator for Authentication/Authorization
```python
# ✓ PRODUCTION PATTERN: Permission decorator
def require_permission(permission: str):
    """Require user to have specific permission."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            current_user = get_current_user()  # From request context
            
            if not current_user:
                raise AuthenticationError("User not authenticated")
            
            if not current_user.has_permission(permission):
                raise AuthorizationError(
                    f"User {current_user.id} lacks permission '{permission}'"
                )
            
            logger.info(
                f"User {current_user.id} calling {func.__name__} "
                f"(has permission '{permission}')"
            )
            return func(*args, **kwargs)
        return wrapper
    return decorator

@require_permission("admin")
def delete_user(user_id: int) -> None:
    """Delete user (admin only)."""
    db.delete_user(user_id)
```

#### Practice 5: Decorator for Timing/Performance Monitoring
```python
# ✓ PRODUCTION PATTERN: Timer decorator
def monitor_performance(alert_threshold_ms: float = 1000.0):
    """Monitor function performance, alert if slow."""
    def decorator(func: Callable) -> Callable:
        @wraps(func)
        def wrapper(*args, **kwargs):
            start = time.time()
            try:
                return func(*args, **kwargs)
            finally:
                duration_ms = (time.time() - start) * 1000
                
                if duration_ms > alert_threshold_ms:
                    logger.warning(
                        f"{func.__name__} took {duration_ms:.1f}ms "
                        f"(threshold: {alert_threshold_ms}ms)"
                    )
                else:
                    logger.debug(f"{func.__name__} took {duration_ms:.1f}ms")
        
        return wrapper
    return decorator

@monitor_performance(alert_threshold_ms=100)
def database_query(query: str) -> list:
    """Run database query."""
    return db.execute(query)
```

### Real-Life Anti-Patterns to Avoid

#### Anti-Pattern 1: Decorators Without @wraps
```python
# ❌ ANTI-PATTERN: Losing function metadata
def my_decorator(func):
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def process_user(user_id: int):
    """Process user."""
    pass

print(process_user.__name__)  # "wrapper" - LOST METADATA!
print(process_user.__doc__)   # None - LOST DOCSTRING!

# ✓ PRODUCTION FIX: Use functools.wraps
from functools import wraps

def my_decorator(func):
    @wraps(func)  # Copy metadata!
    def wrapper(*args, **kwargs):
        print(f"Calling {func.__name__}")
        return func(*args, **kwargs)
    return wrapper

@my_decorator
def process_user(user_id: int):
    """Process user."""
    pass

print(process_user.__name__)  # "process_user" - PRESERVED!
print(process_user.__doc__)   # "Process user." - PRESERVED!
```

#### Anti-Pattern 2: Decorators with Side Effects
```python
# ❌ ANTI-PATTERN: Decorator has side effects (confusing)
execution_count = {}

def count_executions(func):
    """Count function executions (has side effect)."""
    def wrapper(*args, **kwargs):
        name = func.__name__
        execution_count[name] = execution_count.get(name, 0) + 1
        return func(*args, **kwargs)
    return wrapper

# Problem: Hard to test, global state, unpredictable

# ✓ PRODUCTION PATTERN: Decorators without side effects
def count_executions(func):
    """Count executions and track in logger."""
    call_count = [0]  # Use list for mutable closure
    
    @wraps(func)
    def wrapper(*args, **kwargs):
        call_count[0] += 1
        logger.info(f"{func.__name__} call #{call_count[0]}")
        return func(*args, **kwargs)
    
    wrapper.call_count = lambda: call_count[0]
    return wrapper

@count_executions
def process():
    pass

process()
process()
print(process.call_count())  # 2
```

#### Anti-Pattern 3: Stacking Decorators Incorrectly
```python
# ❌ ANTI-PATTERN: Order matters, but not documented
@cache_result
@log_execution
@require_permission("admin")
def critical_operation():
    """What order does these execute?"""
    pass

# Problem: If cache_result is on top, logged call might be cached without logging on 2nd call!

# ✓ PRODUCTION PATTERN: Document or reorder
# The order should be: innermost is applied first
# So @log_execution is CLOSEST to function, caching wraps it

@cache_result        # Outermost: cache before checking permission
@log_execution       # Middle: log when not cached
@require_permission  # Innermost: closest to function
def critical_operation():
    """
    Decorators apply in reverse order:
    1. Check permission
    2. Log execution
    3. Cache result
    """
    pass

# Better: Be explicit
def critical_operation():
    """Critical operation."""
    # Apply decorators explicitly with clear purpose
    pass

critical_operation = require_permission("admin")(critical_operation)
critical_operation = log_execution(critical_operation)
critical_operation = cache_result(critical_operation)
```

---

## 5. LOGGING

### Short Explanation
Logging records what your program is doing. Essential for debugging, monitoring, and understanding production behavior.

### Best Practices for Production

#### Practice 1: Use Proper Log Levels
```python
import logging

logger = logging.getLogger(__name__)

# ✓ PRODUCTION PATTERN: Correct log levels
logger.debug("User ID: 123, computed value: 45.6")     # Dev debugging only
logger.info("User 123 logged in from 192.168.1.1")      # Important events
logger.warning("API response time 5s (threshold: 1s)")   # Unexpected but ok
logger.error("Failed to save user: DB connection timeout")  # Error occurred
logger.critical("Out of memory - service crashing")       # System failure

# ❌ ANTI-PATTERN: Using wrong levels
logger.info("x=5")  # Debug info, not info!
logger.warning("Processing item")  # Normal flow, not warning!
logger.error("Retrying operation")  # Not an error, just info!
```

#### Practice 2: Structured Logging for Debugging
```python
# ❌ ANTI-PATTERN: Unstructured message
logger.info(f"Processing order for user {user_id} with {len(items)} items")

# ✓ PRODUCTION PATTERN: Structured context
logger.info(
    "Processing order",
    extra={
        "user_id": user_id,
        "item_count": len(items),
        "order_id": order.id,
        "total": order.total,
    }
)

# Better with context manager
import structlog

logger = structlog.get_logger()
logger.info("processing_order", user_id=user_id, item_count=len(items))

# Output: {"event": "processing_order", "user_id": 123, "item_count": 5}
```

#### Practice 3: Log at Boundaries (Entry/Exit)
```python
# ✓ PRODUCTION PATTERN: Log at function boundaries
def process_user_order(user_id: int, order_data: dict) -> Order:
    """Process user order (logged for tracing)."""
    logger.info(
        "Starting order processing",
        extra={"user_id": user_id, "items": len(order_data.get("items", []))}
    )
    
    try:
        user = db.get_user(user_id)
        if not user:
            logger.warning(f"User {user_id} not found")
            raise UserNotFoundError(user_id)
        
        total = sum(item["price"] * item["qty"] for item in order_data["items"])
        order = Order(user_id=user_id, total=total)
        db.save(order)
        
        logger.info(
            "Order processing completed",
            extra={"user_id": user_id, "order_id": order.id, "total": total}
        )
        return order
    
    except Exception as e:
        logger.error(
            "Order processing failed",
            extra={
                "user_id": user_id,
                "error": str(e),
                "error_type": type(e).__name__,
            },
            exc_info=True  # Include stack trace
        )
        raise
```

#### Practice 4: Don't Log Sensitive Data
```python
# ❌ ANTI-PATTERN: Logging sensitive information
user = {"username": "alice", "password": "secret123", "ssn": "123-45-6789"}
logger.info(f"Creating user: {user}")  # PASSWORDS IN LOGS!

# ✓ PRODUCTION PATTERN: Filter sensitive data
def mask_sensitive_fields(data: dict) -> dict:
    """Remove sensitive fields from logging."""
    sensitive = {"password", "token", "api_key", "ssn", "credit_card"}
    return {
        k: "***REDACTED***" if k in sensitive else v
        for k, v in data.items()
    }

user = {"username": "alice", "password": "secret123", "ssn": "123-45-6789"}
logger.info(f"Creating user: {mask_sensitive_fields(user)}")
# Output: Creating user: {'username': 'alice', 'password': '***REDACTED***', 'ssn': '***REDACTED***'}
```

#### Practice 5: Use Correlation IDs for Tracing
```python
import uuid
from contextvars import ContextVar

# ✓ PRODUCTION PATTERN: Request tracing with correlation IDs
request_id = ContextVar("request_id", default=None)

def set_request_id():
    """Set correlation ID for this request."""
    request_id.set(str(uuid.uuid4()))

def get_request_id():
    """Get current correlation ID."""
    return request_id.get()

class RequestLoggingMiddleware:
    """Middleware to add request ID to all logs."""
    def __call__(self, request):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        request_id.set(correlation_id)
        
        logger.info("Request started", extra={"correlation_id": correlation_id})
        return request

# In application code
logger.info(
    "User operation",
    extra={
        "user_id": 123,
        "correlation_id": get_request_id(),
    }
)

# Later, in async operation
logger.info(
    "Background job started",
    extra={
        "job_id": 456,
        "correlation_id": get_request_id(),  # Same ID across async boundaries!
    }
)
```

### Real-Life Anti-Patterns to Avoid

#### Anti-Pattern 1: Logging in Exception Handlers AND Raising
```python
# ❌ ANTI-PATTERN: Double logging (logs appear twice)
def process_order(order_id):
    try:
        return db.get_order(order_id)
    except OrderNotFoundError as e:
        logger.error(f"Order not found: {e}")  # Log here
        raise  # Then raise - gets logged again by caller

# Caller
try:
    order = process_order(123)
except OrderNotFoundError:
    logger.error(f"Failed to get order")  # Logs AGAIN!

# ✓ PRODUCTION PATTERN: Choose one place to log
def process_order(order_id: int) -> Order:
    """Get order (raises on error, let caller log)."""
    order = db.get_order(order_id)
    if not order:
        raise OrderNotFoundError(f"Order {order_id} not found")
    return order

# Caller logs once
try:
    order = process_order(123)
except OrderNotFoundError as e:
    logger.error(f"Failed to get order: {e}", exc_info=True)
    # Proper log with stack trace
```

#### Anti-Pattern 2: Logging Without Context
```python
# ❌ ANTI-PATTERN: No context for debugging
logger.info("Processing started")  # Started? For what? Who?
logger.info("Found 5 items")       # Which items? For what operation?
logger.error("Failed")             # What failed? Why?

# ✓ PRODUCTION PATTERN: Always include context
logger.info(
    "Order processing started",
    extra={
        "order_id": 123,
        "user_id": 456,
        "item_count": 3,
    }
)

logger.info(
    "Found matching items",
    extra={
        "count": 5,
        "filter": {"status": "active"},
        "operation": "user_search",
    }
)

logger.error(
    "Database operation failed",
    extra={
        "operation": "insert_user",
        "retry_count": 2,
        "error_type": "ConnectionTimeout",
    },
    exc_info=True,
)
```

#### Anti-Pattern 3: Logging High-Volume Operations in Loops
```python
# ❌ ANTI-PATTERN: Logs get flooded, performance suffers
for user in users:  # 100,000 users
    logger.info(f"Processing user {user.id}")  # 100,000 log lines!
    process_user(user)
    logger.info(f"Finished user {user.id}")    # Another 100,000!

# ✓ PRODUCTION PATTERN: Log in batches or at boundaries
logger.info(
    "Starting bulk user processing",
    extra={"user_count": len(users)}
)

for i, user in enumerate(users):
    process_user(user)
    
    # Log progress periodically
    if (i + 1) % 1000 == 0:
        logger.info(
            "Bulk processing progress",
            extra={"processed": i + 1, "total": len(users)}
        )

logger.info(
    "Bulk user processing completed",
    extra={"user_count": len(users)}
)
```

---

## 6. EXCEPTION HANDLING

### Short Explanation
Exception handling catches and handles errors gracefully. Production code must handle exceptions strategically.

### Best Practices for Production

#### Practice 1: Specific Exception Handling
```python
# ❌ ANTI-PATTERN: Catching all exceptions (hides bugs)
def get_user(user_id):
    try:
        return db.query("SELECT * FROM users WHERE id=?", user_id)
    except:  # Catches EVERYTHING, even bugs!
        return None

# ✓ PRODUCTION PATTERN: Catch specific exceptions
def get_user(user_id: int) -> Optional[User]:
    """Get user by ID."""
    try:
        return db.query_user(user_id)
    except DatabaseError as e:  # Only database errors
        logger.error(f"Database error fetching user {user_id}: {e}")
        raise UserNotFoundError(f"Could not fetch user {user_id}") from e
    except ValidationError as e:  # Only validation errors
        logger.warning(f"Invalid user ID {user_id}: {e}")
        return None
    # Other exceptions propagate (bugs in our code)
```

#### Practice 2: Custom Exceptions for Business Logic
```python
# ❌ ANTI-PATTERN: Generic exceptions (unclear what happened)
def withdraw_money(account_id, amount):
    balance = get_balance(account_id)
    if amount > balance:
        raise Exception("Not enough money")  # Generic!
    
    deduct(account_id, amount)

# ✓ PRODUCTION PATTERN: Custom exceptions with context
class InsufficientFundsError(Exception):
    """Raised when account has insufficient funds."""
    def __init__(self, account_id: int, requested: float, available: float):
        self.account_id = account_id
        self.requested = requested
        self.available = available
        super().__init__(
            f"Account {account_id}: requested ${requested:.2f}, "
            f"available ${available:.2f}"
        )

def withdraw_money(account_id: int, amount: float) -> None:
    """Withdraw money from account."""
    balance = get_balance(account_id)
    
    if amount > balance:
        raise InsufficientFundsError(account_id, amount, balance)
    
    deduct(account_id, amount)

# Caller can handle specifically
try:
    withdraw_money(123, 1000)
except InsufficientFundsError as e:
    logger.warning(f"Withdrawal rejected: {e}")
    notify_user(e.account_id, "Insufficient funds")
except DatabaseError as e:
    logger.error(f"Failed to process withdrawal: {e}")
    raise
```

#### Practice 3: Exception Chaining for Context
```python
# ❌ ANTI-PATTERN: Losing context (what caused this?)
def process_payment(payment_id):
    try:
        return gateway.process(payment_id)
    except Exception:
        raise PaymentError("Payment failed")  # Lost original context!

# ✓ PRODUCTION PATTERN: Chain exceptions with 'from'
def process_payment(payment_id: int) -> PaymentResult:
    """Process payment."""
    try:
        return gateway.process(payment_id)
    except GatewayTimeoutError as e:
        logger.error(f"Payment gateway timeout for {payment_id}")
        raise PaymentFailedError(f"Payment gateway timed out") from e
    except GatewayError as e:
        logger.error(f"Payment gateway error: {e}", exc_info=True)
        raise PaymentFailedError(f"Payment processing failed: {e}") from e

# Stack trace shows original cause
# PaymentFailedError: Payment processing failed: Connection refused
# From: GatewayError: Connection refused
```

#### Practice 4: Use Context Managers for Cleanup
```python
# ❌ ANTI-PATTERN: Manual cleanup (easy to forget)
def process_file(filename):
    file = open(filename)
    try:
        return file.read()
    finally:
        file.close()  # Manual cleanup

# ✓ PRODUCTION PATTERN: Context managers (guaranteed cleanup)
def process_file(filename: str) -> str:
    """Process file (cleanup guaranteed)."""
    with open(filename) as file:
        return file.read()  # File closed automatically

# Custom context manager
class DatabaseConnection:
    def __enter__(self):
        self.conn = db.connect()
        logger.info("Database connection opened")
        return self.conn
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        self.conn.close()
        logger.info("Database connection closed")
        # Return False to propagate exceptions

def get_user_with_connection(user_id: int) -> User:
    """Get user with guaranteed connection cleanup."""
    with DatabaseConnection() as conn:
        return conn.query_user(user_id)
```

#### Practice 5: Don't Ignore Exceptions
```python
# ❌ ANTI-PATTERN: Silent failure (application continues, broken)
def save_config(filename, config):
    try:
        with open(filename, 'w') as f:
            json.dump(config, f)
    except Exception:
        pass  # Silently ignore! Config not saved!

# ✓ PRODUCTION PATTERN: Decide explicitly
def save_config(filename: str, config: dict) -> bool:
    """Save configuration, return success status."""
    try:
        with open(filename, 'w') as f:
            json.dump(config, f)
        logger.info(f"Config saved to {filename}")
        return True
    except IOError as e:
        logger.error(f"Failed to save config to {filename}: {e}")
        return False
    except json.JSONDecodeError as e:
        logger.error(f"Config is not valid JSON: {e}")
        return False

# Or re-raise with context
def save_config_strict(filename: str, config: dict) -> None:
    """Save configuration, raising on error."""
    try:
        with open(filename, 'w') as f:
            json.dump(config, f)
    except IOError as e:
        raise ConfigSaveError(f"Cannot write to {filename}") from e
```

### Real-Life Anti-Patterns to Avoid

#### Anti-Pattern 1: Over-Catching (Masking Bugs)
```python
# ❌ ANTI-PATTERN: Catches program bugs too
def process_items(items):
    try:
        total = 0
        for item in items:
            total += item["price"]  # KeyError if "price" missing
        return total
    except:
        return 0  # Hides bug! Missing key in item

# Caller thinks no items, but actually bug in data

# ✓ PRODUCTION PATTERN: Validate input explicitly
def process_items(items: List[dict]) -> float:
    """Process items (validates input)."""
    validate_items(items)  # Fail fast on bad data
    
    total = 0
    for item in items:
        if "price" not in item:
            raise ValueError(f"Item missing price: {item}")
        total += item["price"]
    
    return total

def validate_items(items):
    """Validate items structure."""
    if not isinstance(items, list):
        raise TypeError("Items must be a list")
    for item in items:
        if not isinstance(item, dict):
            raise TypeError(f"Item must be dict, got {type(item)}")
```

#### Anti-Pattern 2: Resource Leaks Due to Exceptions
```python
# ❌ ANTI-PATTERN: Resource not closed on exception
def read_large_file(filename):
    file = open(filename)
    line_count = 0
    for line in file:
        if "error" in line:
            raise DataError("Found error in file")  # File not closed!
        line_count += 1
    file.close()
    return line_count

# ✓ PRODUCTION PATTERN: Context manager (handles cleanup)
def read_large_file(filename: str) -> int:
    """Read file safely (cleanup guaranteed)."""
    line_count = 0
    with open(filename) as file:
        for line in file:
            if "error" in line:
                raise DataError(f"Found error in {filename}")
            line_count += 1
    # File closed automatically, even on exception
    return line_count
```

#### Anti-Pattern 3: Lost Exception Information
```python
# ❌ ANTI-PATTERN: Exception swallowed
def call_api(url):
    try:
        return requests.get(url).json()
    except Exception as e:
        logger.warning(f"Failed to call {url}")
        return {}  # No information about WHAT failed

# Later, debugging is hard

# ✓ PRODUCTION PATTERN: Preserve exception details
def call_api(url: str) -> dict:
    """Call API, raising on error with context."""
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.Timeout:
        logger.error(f"API timeout for {url} (5s)")
        raise APITimeoutError(url) from None
    except requests.ConnectionError as e:
        logger.error(f"Cannot connect to {url}: {e}")
        raise APIConnectionError(url) from e
    except requests.HTTPError as e:
        logger.error(f"API error: {e.response.status_code} from {url}")
        raise APIError(f"HTTP {e.response.status_code} from {url}") from e
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON response from {url}: {e}")
        raise APIError(f"Invalid JSON from {url}") from e
```

---

## 7. OOP CONCEPTS

### Short Explanation
Object-Oriented Programming organizes code into classes and objects. Essential for large codebases.

### Best Practices for Production

#### Practice 1: Composition Over Inheritance
```python
# ❌ ANTI-PATTERN: Inheritance hierarchy (fragile)
class Animal:
    def move(self): pass

class Mammal(Animal):
    def nurse(self): pass

class Dog(Mammal):
    def move(self):
        return "running"
    def bark(self):
        return "woof"

class Duck(Mammal):  # Problem: ducks don't nurse!
    def move(self):
        return "swimming"

# ✓ PRODUCTION PATTERN: Composition (flexible)
class Locomotion:
    def move(self): raise NotImplementedError

class Running(Locomotion):
    def move(self):
        return "running"

class Swimming(Locomotion):
    def move(self):
        return "swimming"

class Dog:
    def __init__(self):
        self.locomotion = Running()
    
    def move(self):
        return self.locomotion.move()
    
    def bark(self):
        return "woof"

class Duck:
    def __init__(self):
        self.locomotion = Swimming()
    
    def move(self):
        return self.locomotion.move()
```

#### Practice 2: Single Responsibility Principle
```python
# ❌ ANTI-PATTERN: Class does too much
class User:
    def __init__(self, name, email):
        self.name = name
        self.email = email
    
    def save_to_database(self):
        """Save to DB"""
        pass
    
    def send_email(self, message):
        """Send email"""
        pass
    
    def generate_report(self):
        """Generate report"""
        pass
    
    def validate_email(self):
        """Validate email"""
        pass

# Hard to test, change, extend

# ✓ PRODUCTION PATTERN: Single responsibility
class User:
    """Represents a user (data only)."""
    def __init__(self, name: str, email: str):
        self.name = name
        self.email = email

class UserRepository:
    """Handles user persistence."""
    def save(self, user: User) -> None:
        db.insert("users", {"name": user.name, "email": user.email})
    
    def load(self, user_id: int) -> User:
        row = db.query("SELECT * FROM users WHERE id=?", user_id)
        return User(row["name"], row["email"])

class EmailService:
    """Handles email operations."""
    def send(self, to: str, message: str) -> None:
        smtp.send(to, message)

class ReportGenerator:
    """Generates reports."""
    def generate_user_report(self, user: User) -> str:
        return f"User: {user.name} ({user.email})"

class EmailValidator:
    """Validates email addresses."""
    def is_valid(self, email: str) -> bool:
        return "@" in email and "." in email
```

#### Practice 3: Encapsulation with Properties
```python
# ❌ ANTI-PATTERN: Public attributes (brittle)
class Account:
    def __init__(self, balance: float):
        self.balance = balance  # Anyone can modify!

account = Account(100)
account.balance = -1000  # Oops, negative balance!

# ✓ PRODUCTION PATTERN: Private attributes with properties
class Account:
    def __init__(self, balance: float):
        self._balance = balance  # Private
    
    @property
    def balance(self) -> float:
        """Get balance."""
        return self._balance
    
    def withdraw(self, amount: float) -> None:
        """Withdraw with validation."""
        if amount > self._balance:
            raise InsufficientFundsError()
        if amount < 0:
            raise ValueError("Cannot withdraw negative amount")
        self._balance -= amount
    
    def deposit(self, amount: float) -> None:
        """Deposit with validation."""
        if amount <= 0:
            raise ValueError("Must deposit positive amount")
        self._balance += amount

account = Account(100)
# account.balance = -1000  # AttributeError - can't set!
account.withdraw(50)  # Validated
print(account.balance)  # 50
```

#### Practice 4: Inheritance for IS-A Relationships
```python
# ✓ PRODUCTION PATTERN: Inheritance when IS-A relationship exists
class PaymentMethod(ABC):
    """Abstract base for payment methods."""
    
    @abstractmethod
    def process(self, amount: float) -> bool:
        """Process payment."""
        pass
    
    @abstractmethod
    def validate(self) -> bool:
        """Validate payment method."""
        pass

class CreditCard(PaymentMethod):
    """Credit card payment."""
    def __init__(self, number: str, cvv: str):
        self.number = number
        self.cvv = cvv
    
    def process(self, amount: float) -> bool:
        return self._charge_card(amount)
    
    def validate(self) -> bool:
        return len(self.number) == 16 and len(self.cvv) == 3
    
    def _charge_card(self, amount: float) -> bool:
        return gateway.charge(self.number, amount)

class PayPal(PaymentMethod):
    """PayPal payment."""
    def __init__(self, email: str, password: str):
        self.email = email
        self.password = password
    
    def process(self, amount: float) -> bool:
        return paypal_api.charge(self.email, amount)
    
    def validate(self) -> bool:
        return "@" in self.email

# Usage - polymorphism
def checkout(cart: Cart, payment: PaymentMethod) -> bool:
    """Checkout with any payment method."""
    if not payment.validate():
        raise ValidationError("Invalid payment method")
    
    total = cart.total()
    return payment.process(total)
```

#### Practice 5: Using dataclasses for Data Classes
```python
# ❌ ANTI-PATTERN: Boilerplate __init__ and __repr__
class User:
    def __init__(self, id, name, email, is_active=True):
        self.id = id
        self.name = name
        self.email = email
        self.is_active = is_active
    
    def __repr__(self):
        return f"User(id={self.id}, name={self.name}, email={self.email}, is_active={self.is_active})"
    
    def __eq__(self, other):
        return (self.id == other.id and 
                self.name == other.name and
                self.email == other.email and
                self.is_active == other.is_active)

# ✓ PRODUCTION PATTERN: Dataclasses (automatic boilerplate)
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class User:
    id: int
    name: str
    email: str
    is_active: bool = True
    created_at: Optional[str] = field(default=None)
    
    def __post_init__(self):
        """Validate after creation."""
        if not self.name:
            raise ValueError("Name cannot be empty")
        if "@" not in self.email:
            raise ValueError("Invalid email")

# Automatically gets __init__, __repr__, __eq__
user = User(1, "Alice", "alice@example.com")
print(user)  # User(id=1, name='Alice', email='alice@example.com', is_active=True, created_at=None)
```

### Real-Life Anti-Patterns to Avoid

#### Anti-Pattern 1: God Classes
```python
# ❌ ANTI-PATTERN: One class does everything
class Application:
    def __init__(self):
        self.users = []
        self.orders = []
        self.config = {}
    
    def create_user(self, name): pass
    def update_user(self, id): pass
    def delete_user(self, id): pass
    def create_order(self, user_id): pass
    def process_payment(self): pass
    def generate_report(self): pass
    def send_email(self): pass
    def log_event(self): pass
    # ... 50 more methods

# Hard to test, maintain, understand

# ✓ PRODUCTION FIX: Break into classes
class UserService:
    def create(self, name: str) -> User: pass
    def update(self, user_id: int, name: str) -> User: pass
    def delete(self, user_id: int) -> None: pass

class OrderService:
    def create(self, user_id: int) -> Order: pass
    def process_payment(self, order_id: int) -> bool: pass

class ReportService:
    def generate(self, report_type: str) -> str: pass

class EmailService:
    def send(self, to: str, subject: str, body: str) -> bool: pass

class Logger:
    def log_event(self, event: str, data: dict) -> None: pass

class Application:
    def __init__(self):
        self.users = UserService()
        self.orders = OrderService()
        self.reports = ReportService()
        self.email = EmailService()
        self.logger = Logger()
```

#### Anti-Pattern 2: Circular Dependencies
```python
# ❌ ANTI-PATTERN: Classes depend on each other (hard to test, change)
class User:
    def __init__(self, name):
        self.name = name
        self.orders = []  # Depends on Order
    
    def create_order(self):
        order = Order(self)  # Creates Order
        self.orders.append(order)
        return order

class Order:
    def __init__(self, user):
        self.user = user  # Depends on User
    
    def cancel(self):
        self.user.orders.remove(self)  # Modifies User

# Can't test User without Order, can't test Order without User

# ✓ PRODUCTION FIX: Use composition/dependency injection
class Order:
    def __init__(self, order_id: int, user_id: int):
        self.id = order_id
        self.user_id = user_id

class OrderRepository:
    def __init__(self, db):
        self.db = db
    
    def save(self, order: Order) -> None:
        self.db.insert("orders", {"id": order.id, "user_id": order.user_id})
    
    def delete(self, order_id: int) -> None:
        self.db.delete("orders", order_id)

class User:
    def __init__(self, user_id: int, name: str):
        self.id = user_id
        self.name = name

# No circular dependencies - testable!
```

---

## 8. SOLID PRINCIPLES

### Short Explanation
SOLID are 5 principles for writing maintainable, scalable code: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.

### Best Practices for Production

#### Principle 1: Single Responsibility (SRP)
```python
# ❌ VIOLATION: Class has multiple reasons to change
class Order:
    """Order handling - should only handle order logic."""
    def __init__(self, items):
        self.items = items
        self.total = sum(item.price for item in items)
    
    def save_to_database(self):
        """Database responsibility - should not be here!"""
        db.insert("orders", {"items": self.items, "total": self.total})
    
    def send_confirmation_email(self):
        """Email responsibility - should not be here!"""
        email.send(f"Order confirmed. Total: {self.total}")
    
    def calculate_tax(self):
        """Tax calculation - should not be here!"""
        return self.total * 0.08

# ✓ FOLLOWS SRP: Each class has ONE reason to change
class Order:
    """Order data and logic only."""
    def __init__(self, items: List[Item]):
        self.items = items
    
    @property
    def total(self) -> float:
        return sum(item.price for item in self.items)

class OrderRepository:
    """Only responsible for persistence."""
    def save(self, order: Order) -> int:
        return db.insert("orders", {
            "items": order.items,
            "total": order.total
        })

class EmailService:
    """Only responsible for email."""
    def send_confirmation(self, email: str, total: float) -> bool:
        return email.send(email, f"Order confirmed. Total: ${total:.2f}")

class TaxCalculator:
    """Only responsible for tax calculation."""
    def calculate(self, amount: float, rate: float = 0.08) -> float:
        return amount * rate
```

#### Principle 2: Open/Closed (OCP)
```python
# ❌ VIOLATION: Closed for extension (must modify class to add features)
class PaymentProcessor:
    def process(self, payment):
        if payment.type == "credit_card":
            return self._process_credit_card(payment)
        elif payment.type == "paypal":
            return self._process_paypal(payment)
        elif payment.type == "bitcoin":  # Adding new type requires modifying class!
            return self._process_bitcoin(payment)
        else:
            raise ValueError(f"Unknown payment type: {payment.type}")

# ✓ FOLLOWS OCP: Open for extension, closed for modification
class PaymentProcessor:
    """Process payment with any strategy."""
    def __init__(self, strategies: dict):
        self.strategies = strategies
    
    def process(self, payment: Payment) -> bool:
        strategy = self.strategies.get(payment.type)
        if not strategy:
            raise ValueError(f"No strategy for {payment.type}")
        return strategy.process(payment)

class PaymentStrategy(ABC):
    """Strategy interface."""
    @abstractmethod
    def process(self, payment: Payment) -> bool:
        pass

class CreditCardStrategy(PaymentStrategy):
    def process(self, payment: Payment) -> bool:
        return gateway.charge_card(payment)

class PayPalStrategy(PaymentStrategy):
    def process(self, payment: Payment) -> bool:
        return paypal_api.charge(payment)

class BitcoinStrategy(PaymentStrategy):
    def process(self, payment: Payment) -> bool:
        return blockchain.transfer(payment)

# To add new payment type: just add new strategy, no modification!
processor = PaymentProcessor({
    "credit_card": CreditCardStrategy(),
    "paypal": PayPalStrategy(),
    "bitcoin": BitcoinStrategy(),
    "stripe": StripeStrategy(),  # New type - no modifications to PaymentProcessor!
})
```

#### Principle 3: Liskov Substitution (LSP)
```python
# ❌ VIOLATION: Subclass breaks contract
class Bird(ABC):
    @abstractmethod
    def fly(self) -> str:
        pass

class Eagle(Bird):
    def fly(self) -> str:
        return "Flying high"

class Penguin(Bird):  # VIOLATION: Penguins can't fly!
    def fly(self) -> str:
        raise NotImplementedError("Penguins can't fly")

# Code breaks when using Penguin as Bird
def let_bird_fly(bird: Bird):
    return bird.fly()  # Works for Eagle, crashes for Penguin!

# ✓ FOLLOWS LSP: Subclasses are truly substitutable
class Bird(ABC):
    @abstractmethod
    def move(self) -> str:
        pass

class FlyingBird(Bird):
    @abstractmethod
    def fly(self) -> str:
        pass
    
    def move(self) -> str:
        return self.fly()

class Eagle(FlyingBird):
    def fly(self) -> str:
        return "Flying high"

class Penguin(Bird):
    def move(self) -> str:
        return "Swimming underwater"

# Now all Birds are truly substitutable
def let_bird_move(bird: Bird) -> str:
    return bird.move()  # Works for ALL birds
```

#### Principle 4: Interface Segregation (ISP)
```python
# ❌ VIOLATION: Fat interface forces unnecessary implementations
class Worker(ABC):
    """Fat interface - not all workers do all things."""
    @abstractmethod
    def work(self): pass
    
    @abstractmethod
    def manage_staff(self): pass
    
    @abstractmethod
    def attend_meetings(self): pass
    
    @abstractmethod
    def code(self): pass

class Developer(Worker):
    def work(self): return "Coding"
    def manage_staff(self): raise NotImplementedError("Developers don't manage")
    def attend_meetings(self): raise NotImplementedError("Developers skip meetings")
    def code(self): return "Writing code"

# ✓ FOLLOWS ISP: Small, focused interfaces
class Worker(ABC):
    @abstractmethod
    def work(self): pass

class Manager(ABC):
    @abstractmethod
    def manage_staff(self): pass

class Attendee(ABC):
    @abstractmethod
    def attend_meetings(self): pass

class Coder(ABC):
    @abstractmethod
    def code(self): pass

class Developer(Worker, Coder):
    def work(self): return "Coding"
    def code(self): return "Writing code"

class TeamLead(Worker, Manager, Attendee, Coder):
    def work(self): return "Leadership"
    def manage_staff(self): return "Managing team"
    def attend_meetings(self): return "In meeting"
    def code(self): return "Code review"

# Each class only implements what it needs
```

#### Principle 5: Dependency Inversion (DIP)
```python
# ❌ VIOLATION: High-level modules depend on low-level details
class EmailService:
    """Low-level detail - depends on specific email provider."""
    def send(self, to: str, message: str):
        smtp = smtplib.SMTP("gmail.com")
        smtp.send_message(to, message)

class NotificationService:
    """High-level - depends directly on EmailService."""
    def __init__(self):
        self.email = EmailService()  # Tightly coupled!
    
    def notify(self, to: str, message: str):
        self.email.send(to, message)

# Can't test NotificationService without real EmailService
# Can't use different email provider without modifying code

# ✓ FOLLOWS DIP: Depend on abstractions, not concrete implementations
class NotificationChannel(ABC):
    """Abstract interface - both depend on this."""
    @abstractmethod
    def send(self, to: str, message: str) -> bool:
        pass

class EmailNotification(NotificationChannel):
    """Low-level detail - implements interface."""
    def send(self, to: str, message: str) -> bool:
        return smtp.send(to, message)

class SMSNotification(NotificationChannel):
    """Another low-level detail - implements interface."""
    def send(self, to: str, message: str) -> bool:
        return twilio.send_sms(to, message)

class NotificationService:
    """High-level - depends on abstraction, not details."""
    def __init__(self, channel: NotificationChannel):
        self.channel = channel  # Depends on interface!
    
    def notify(self, to: str, message: str) -> bool:
        return self.channel.send(to, message)

# Now loosely coupled - can swap channels easily
service = NotificationService(EmailNotification())
service.notify("alice@example.com", "Hello")

service = NotificationService(SMSNotification())  # Different channel, same code!
service.notify("+1234567890", "Hello")
```

---

## 9. DESIGN PATTERNS

### Short Explanation
Design patterns are reusable solutions for common problems. Essential patterns every developer should know.

### Best Practices for Production

#### Pattern 1: Singleton (One Instance)
```python
# ✓ PRODUCTION PATTERN: Singleton for resources
class DatabaseConnection:
    """Singleton - only one database connection instance."""
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            self.connection = db.connect("postgresql://localhost/mydb")
            self._initialized = True
            logger.info("Database connection initialized")
    
    def query(self, sql):
        return self.connection.execute(sql)

# Usage
db1 = DatabaseConnection()
db2 = DatabaseConnection()
assert db1 is db2  # Same instance!

# Better: Use context manager
class DatabaseConnection:
    _instance = None
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        self.connection = db.connect("postgresql://localhost/mydb")

# Dependency injection is often better than Singleton!
```

#### Pattern 2: Factory (Create Objects)
```python
# ✓ PRODUCTION PATTERN: Factory pattern for flexible object creation
class PaymentMethodFactory:
    """Create payment methods."""
    
    @staticmethod
    def create(payment_type: str, **kwargs) -> PaymentMethod:
        if payment_type == "credit_card":
            return CreditCardPayment(
                kwargs["card_number"],
                kwargs["cvv"]
            )
        elif payment_type == "paypal":
            return PayPalPayment(kwargs["email"])
        elif payment_type == "stripe":
            return StripePayment(kwargs["token"])
        else:
            raise ValueError(f"Unknown payment type: {payment_type}")

class PaymentMethod(ABC):
    @abstractmethod
    def process(self, amount: float) -> bool:
        pass

class CreditCardPayment(PaymentMethod):
    def __init__(self, card_number: str, cvv: str):
        self.card_number = card_number
        self.cvv = cvv
    
    def process(self, amount: float) -> bool:
        return gateway.charge(self.card_number, amount)

# Usage - caller doesn't know details
payment = PaymentMethodFactory.create(
    "stripe",
    token="pk_test_123"
)
payment.process(99.99)
```

#### Pattern 3: Strategy (Interchangeable Algorithms)
```python
# ✓ PRODUCTION PATTERN: Strategy for flexible algorithms
class SortingStrategy(ABC):
    @abstractmethod
    def sort(self, items: List) -> List:
        pass

class QuickSort(SortingStrategy):
    def sort(self, items: List) -> List:
        # Quicksort implementation
        return sorted(items)

class MergeSort(SortingStrategy):
    def sort(self, items: List) -> List:
        # Mergesort implementation
        return sorted(items)

class Sorter:
    def __init__(self, strategy: SortingStrategy):
        self.strategy = strategy
    
    def sort(self, items: List) -> List:
        return self.strategy.sort(items)

# Usage - easily swap strategies
sorter = Sorter(QuickSort())
sorted_items = sorter.sort([3, 1, 4, 1, 5])

sorter.strategy = MergeSort()  # Change strategy
sorted_items = sorter.sort([3, 1, 4, 1, 5])
```

#### Pattern 4: Adapter (Make Incompatible Interfaces Compatible)
```python
# ✓ PRODUCTION PATTERN: Adapter for third-party libraries
class PaymentGateway(ABC):
    """Our interface."""
    @abstractmethod
    def charge(self, amount: float, card: Card) -> PaymentResult:
        pass

class StripeAdapter(PaymentGateway):
    """Adapt Stripe SDK to our interface."""
    def __init__(self):
        self.stripe = stripe.Stripe(api_key="sk_test_123")
    
    def charge(self, amount: float, card: Card) -> PaymentResult:
        # Adapt Stripe SDK to our interface
        try:
            stripe_charge = self.stripe.charges.create(
                amount=int(amount * 100),
                currency="usd",
                source=card.token
            )
            return PaymentResult(
                success=True,
                transaction_id=stripe_charge.id
            )
        except stripe.CardError as e:
            return PaymentResult(
                success=False,
                error=str(e)
            )

# Usage - consistent interface
gateway = StripeAdapter()
result = gateway.charge(99.99, card)
```

#### Pattern 5: Observer (Notify Multiple Objects)
```python
# ✓ PRODUCTION PATTERN: Observer for event handling
class EventEmitter:
    """Emit events to multiple observers."""
    def __init__(self):
        self.listeners = {}
    
    def on(self, event: str, callback: Callable):
        """Register event listener."""
        if event not in self.listeners:
            self.listeners[event] = []
        self.listeners[event].append(callback)
    
    def emit(self, event: str, *args, **kwargs):
        """Emit event to all listeners."""
        if event not in self.listeners:
            return
        
        for listener in self.listeners[event]:
            try:
                listener(*args, **kwargs)
            except Exception as e:
                logger.error(f"Listener error for {event}: {e}")

# Usage
emitter = EventEmitter()

emitter.on("user_created", lambda user: send_welcome_email(user))
emitter.on("user_created", lambda user: notify_analytics(user))
emitter.on("user_deleted", lambda user: archive_user(user))

# Emit events
new_user = User("Alice")
emitter.emit("user_created", new_user)
```

#### Pattern 6: Builder (Complex Object Construction)
```python
# ✓ PRODUCTION PATTERN: Builder for complex objects
class QueryBuilder:
    """Build database queries fluently."""
    def __init__(self):
        self._select = []
        self._where = []
        self._joins = []
        self._order = []
        self._limit = None
    
    def select(self, *columns: str) -> "QueryBuilder":
        self._select.extend(columns)
        return self
    
    def where(self, condition: str) -> "QueryBuilder":
        self._where.append(condition)
        return self
    
    def join(self, table: str, condition: str) -> "QueryBuilder":
        self._joins.append((table, condition))
        return self
    
    def order_by(self, column: str, direction: str = "ASC") -> "QueryBuilder":
        self._order.append(f"{column} {direction}")
        return self
    
    def limit(self, count: int) -> "QueryBuilder":
        self._limit = count
        return self
    
    def build(self) -> str:
        """Build SQL query."""
        query = f"SELECT {', '.join(self._select or ['*'])}"
        
        for table, condition in self._joins:
            query += f" JOIN {table} ON {condition}"
        
        if self._where:
            query += f" WHERE {' AND '.join(self._where)}"
        
        if self._order:
            query += f" ORDER BY {', '.join(self._order)}"
        
        if self._limit:
            query += f" LIMIT {self._limit}"
        
        return query

# Usage - fluent interface
query = (QueryBuilder()
    .select("id", "name", "email")
    .where("is_active = true")
    .where("created_at > '2024-01-01'")
    .join("orders", "users.id = orders.user_id")
    .order_by("name")
    .limit(10)
    .build())

print(query)
# SELECT id, name, email 
# JOIN orders ON users.id = orders.user_id 
# WHERE is_active = true AND created_at > '2024-01-01' 
# ORDER BY name ASC 
# LIMIT 10
```

#### Pattern 7: Repository (Data Access Abstraction)
```python
# ✓ PRODUCTION PATTERN: Repository for data access
class Repository(ABC):
    """Abstract repository."""
    @abstractmethod
    def get(self, id: int) -> any:
        pass
    
    @abstractmethod
    def get_all(self) -> List:
        pass
    
    @abstractmethod
    def save(self, entity: any) -> int:
        pass
    
    @abstractmethod
    def delete(self, id: int) -> bool:
        pass

class UserRepository(Repository):
    """User data access."""
    def __init__(self, db):
        self.db = db
    
    def get(self, user_id: int) -> Optional[User]:
        row = self.db.query(
            "SELECT * FROM users WHERE id = ?",
            user_id
        ).first()
        return User(**row) if row else None
    
    def get_all(self) -> List[User]:
        rows = self.db.query("SELECT * FROM users").all()
        return [User(**row) for row in rows]
    
    def save(self, user: User) -> int:
        return self.db.insert("users", {
            "name": user.name,
            "email": user.email
        })
    
    def delete(self, user_id: int) -> bool:
        return self.db.delete("users", user_id) > 0

# Usage - abstraction hides database details
repo = UserRepository(db)
user = repo.get(123)
all_users = repo.get_all()
repo.save(new_user)
```

---

## SUMMARY: PRODUCTION CODE CHECKLIST

### Code Quality
- [ ] All functions have type hints
- [ ] All classes have docstrings
- [ ] Guard clauses used instead of deep nesting
- [ ] No silent failures (explicit error handling)
- [ ] No mutable default arguments
- [ ] Use enums instead of magic strings/numbers

### Error Handling
- [ ] Specific exception types, not bare `except`
- [ ] Custom exceptions for business logic
- [ ] Exceptions chained with `from` for context
- [ ] Resources cleaned up with context managers
- [ ] Logging at entry/exit points

### Testing & Maintainability
- [ ] Functions have single responsibility
- [ ] No circular dependencies
- [ ] Composition used over inheritance
- [ ] SOLID principles followed
- [ ] Design patterns used appropriately

### Performance & Monitoring
- [ ] Appropriate logging at INFO/WARNING/ERROR levels
- [ ] No logging in tight loops
- [ ] Sensitive data not logged
- [ ] Correlation IDs for request tracing
- [ ] Performance monitoring decorators

### Real-World Production Patterns
- [ ] Dependency injection used
- [ ] Abstract interfaces for swappable implementations
- [ ] Repository pattern for data access
- [ ] Builder pattern for complex objects
- [ ] Observer pattern for events
- [ ] Factory pattern for object creation
- [ ] Strategy pattern for algorithms
- [ ] Adapter pattern for third-party libraries

---

## QUICK DECISION TREES

### When to Use Each Loop Type
```
Need to iterate over collection?
  → YES: for loop
  → NO: while loop (condition-based)

Need index?
  → YES: enumerate(collection)
  → NO: for item in collection

Need parallel iteration?
  → YES: zip(list1, list2)
  → NO: for loop

Large collection?
  → YES: Generator expression (list comp)
  → NO: for loop
```

### When to Raise vs Return None
```
Expected failure?
  → YES: Return None or False
  → NO: Raise exception (unexpected)

Caller needs context?
  → YES: Raise exception with info
  → NO: Return None

Critical operation?
  → YES: Always raise (fail fast)
  → NO: Can return None
```

### When to Use Each Design Pattern
```
Need only one instance?
  → Singleton (but consider Dependency Injection)

Need flexible object creation?
  → Factory

Need swappable algorithms?
  → Strategy

Need multiple objects notified?
  → Observer

Building complex objects?
  → Builder

Making incompatible interfaces work together?
  → Adapter

Need abstraction for data access?
  → Repository
```

---

## Conclusion

Production-grade code combines:
1. **Clear logic** (If conditions, Loops)
2. **Testable functions** (Functions)
3. **Flexible extensions** (Decorators, OOP)
4. **Proper observability** (Logging)
5. **Graceful failures** (Exception handling)
6. **Maintainable architecture** (SOLID, Patterns)

Master these 9 topics and you'll write code that production teams actually want to maintain.
