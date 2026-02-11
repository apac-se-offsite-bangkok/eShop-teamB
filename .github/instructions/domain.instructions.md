---
applyTo: "src/**/Domain/**,src/**/*Domain*/**"
---

# Domain Layer Instructions

## Entity Structure

Inherit from base `Entity` class with domain events support:

```csharp
public class Order : Entity, IAggregateRoot
{
    // Private collections for encapsulation
    private readonly List<OrderItem> _orderItems = [];
    
    // Read-only access to collections
    public IReadOnlyCollection<OrderItem> OrderItems => _orderItems.AsReadOnly();
    
    // Private setters for properties
    public DateTime OrderDate { get; private set; }
    public OrderStatus Status { get; private set; }
    public Address Address { get; private set; }
}
```

## Aggregate Root

Only aggregate roots implement `IAggregateRoot` marker interface:

```csharp
public class Order : Entity, IAggregateRoot  // ✅ Aggregate root
public class OrderItem : Entity              // ✅ Child entity (no IAggregateRoot)
```

## Encapsulation Rules

1. **Collections**: Always private with read-only public accessor
2. **Modification**: Only through aggregate root methods
3. **Invariants**: Validate in methods, throw domain exceptions

```csharp
public void AddOrderItem(int productId, string productName, decimal unitPrice, 
    decimal discount, string pictureUrl, int units = 1)
{
    // Invariant: units must be positive
    if (units <= 0)
        throw new OrderingDomainException("Invalid number of units");
    
    var existingItem = _orderItems.SingleOrDefault(o => o.ProductId == productId);
    if (existingItem is not null)
    {
        existingItem.AddUnits(units);
    }
    else
    {
        _orderItems.Add(new OrderItem(productId, productName, unitPrice, discount, pictureUrl, units));
    }
}
```

## Value Objects

Use for concepts without identity:

```csharp
public class Address : ValueObject
{
    public string Street { get; private set; }
    public string City { get; private set; }
    public string State { get; private set; }
    public string Country { get; private set; }
    public string ZipCode { get; private set; }

    public Address(string street, string city, string state, string country, string zipCode)
    {
        Street = street;
        City = city;
        State = state;
        Country = country;
        ZipCode = zipCode;
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Street;
        yield return City;
        yield return State;
        yield return Country;
        yield return ZipCode;
    }
}
```

## Domain Events

Use records implementing `INotification` (MediatR):

```csharp
public record class OrderStartedDomainEvent(
    Order Order,
    string UserId,
    string UserName,
    int CardTypeId,
    string CardNumber,
    string CardSecurityNumber,
    string CardHolderName,
    DateTime CardExpiration) : INotification;
```

Raise events in aggregate methods:

```csharp
public Order(string userId, string userName, Address address, int cardTypeId, 
    string cardNumber, string cardSecurityNumber, string cardHolderName, DateTime cardExpiration)
{
    _orderItems = [];
    OrderDate = DateTime.UtcNow;
    Status = OrderStatus.Submitted;
    Address = address;

    AddDomainEvent(new OrderStartedDomainEvent(this, userId, userName, cardTypeId,
        cardNumber, cardSecurityNumber, cardHolderName, cardExpiration));
}
```

## State Transitions

Encapsulate state changes with domain event emission:

```csharp
public void SetPaidStatus()
{
    if (Status != OrderStatus.StockConfirmed)
    {
        throw new OrderingDomainException(
            $"Cannot change to Paid when status is {Status.Name}");
    }

    Status = OrderStatus.Paid;
    AddDomainEvent(new OrderStatusChangedToPaidDomainEvent(Id, OrderItems));
}

public void SetCancelledStatus()
{
    if (Status == OrderStatus.Paid || Status == OrderStatus.Shipped)
    {
        throw new OrderingDomainException(
            $"Cannot cancel order when status is {Status.Name}");
    }

    Status = OrderStatus.Cancelled;
    AddDomainEvent(new OrderCancelledDomainEvent(this));
}
```

## Domain Exceptions

Create specific domain exceptions:

```csharp
public class OrderingDomainException : Exception
{
    public OrderingDomainException() { }
    public OrderingDomainException(string message) : base(message) { }
    public OrderingDomainException(string message, Exception innerException) 
        : base(message, innerException) { }
}
```

## Repository Interface

Define in domain layer, implement in infrastructure:

```csharp
public interface IOrderRepository : IRepository<Order>
{
    Order Add(Order order);
    void Update(Order order);
    Task<Order?> GetAsync(int orderId);
}
```
