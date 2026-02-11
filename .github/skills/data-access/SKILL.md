---
name: data-access
description: 'Manage data access patterns in eShop .NET projects. Use this skill when creating queries, repositories, or data access code. It enforces consistent patterns using Entity Framework Core with DbContext and Specification pattern for simple services, and Repository + Unit of Work for complex domains.'
---

# Data Access Pattern Manager

## Overview

This skill ensures consistent and performant data access across eShop microservices. It defines when to use direct DbContext vs. Repository pattern, and enforces best practices for EF Core queries.

## Prerequisites

- Entity Framework Core with Npgsql provider
- PostgreSQL database
- Understanding of LINQ and async/await patterns

## Current Service Patterns

| Service | Pattern | Complexity |
|---------|---------|------------|
| Ordering | Repository + Unit of Work + CQRS | Complex domain |
| Catalog | Direct DbContext | Simple CRUD |
| Basket | Redis Repository | Cache-based |

## Core Rules

1. **ALWAYS** use `AsNoTracking()` for read-only queries.
2. **ALWAYS** use projections (`.Select()`) when you don't need full entities.
3. **NEVER** load full entities just to display a subset of fields.
4. **PREFER** specifications for reusable query logic in simple services.
5. **USE** Repository + Unit of Work only for complex domain logic (like Ordering).

## Workflows

### Creating a Read Query (Simple Service like Catalog)

Use direct DbContext with `AsNoTracking()` and projections:

```csharp
// ✅ Correct: Read-only with projection
var items = await context.CatalogItems
    .AsNoTracking()
    .Where(x => x.BrandId == brandId)
    .Select(x => new CatalogItemDto
    {
        Id = x.Id,
        Name = x.Name,
        Price = x.Price
    })
    .ToListAsync();

// ❌ Wrong: Tracking enabled, loading full entity
var items = await context.CatalogItems
    .Where(x => x.BrandId == brandId)
    .ToListAsync();
```

### Creating a Reusable Query (Specification Pattern)

For frequently used query logic, create a specification:

```csharp
// 1. Define the specification
public static class CatalogItemQueries
{
    public static IQueryable<CatalogItem> ByBrand(
        this IQueryable<CatalogItem> query, int brandId)
        => query.Where(x => x.BrandId == brandId);

    public static IQueryable<CatalogItem> InPriceRange(
        this IQueryable<CatalogItem> query, decimal min, decimal max)
        => query.Where(x => x.Price >= min && x.Price <= max);
}

// 2. Use in endpoint (composable)
var items = await context.CatalogItems
    .AsNoTracking()
    .ByBrand(brandId)
    .InPriceRange(10, 100)
    .ToListAsync();
```

### Creating Write Operations (Simple Service)

Use DbContext directly with `SaveChangesAsync()`:

```csharp
// Add
context.CatalogItems.Add(newItem);
await context.SaveChangesAsync();

// Update
var item = await context.CatalogItems.FindAsync(id);
item.Price = newPrice;
await context.SaveChangesAsync();

// Delete
var item = await context.CatalogItems.FindAsync(id);
context.CatalogItems.Remove(item);
await context.SaveChangesAsync();
```

### Creating Write Operations (Complex Domain like Ordering)

Use Repository with Unit of Work:

```csharp
// In command handler
public async Task Handle(CreateOrderCommand command, CancellationToken ct)
{
    var order = new Order(command.BuyerId, command.Address);
    order.AddOrderItem(command.ProductId, command.Quantity, command.Price);

    _orderRepository.Add(order);
    await _orderRepository.UnitOfWork.SaveEntitiesAsync(ct);
}
```

### Avoiding N+1 Queries

Use `.Include()` for related data:

```csharp
// ✅ Correct: Single query with join
var orders = await context.Orders
    .AsNoTracking()
    .Include(o => o.OrderItems)
    .Where(o => o.BuyerId == buyerId)
    .ToListAsync();

// ❌ Wrong: N+1 queries (loads items separately for each order)
var orders = await context.Orders.ToListAsync();
foreach (var order in orders)
{
    var items = await context.OrderItems
        .Where(i => i.OrderId == order.Id)
        .ToListAsync();
}
```

### Pagination

Always paginate large result sets:

```csharp
var pagedItems = await context.CatalogItems
    .AsNoTracking()
    .OrderBy(x => x.Name)
    .Skip(pageIndex * pageSize)
    .Take(pageSize)
    .ToListAsync();
```

## Pattern Selection Guide

### Use Direct DbContext + Specifications When:
- Service has simple CRUD operations
- No complex business rules
- Minimal domain events
- Examples: Catalog, Webhooks

### Use Repository + Unit of Work When:
- Complex domain logic with aggregates
- Domain events need to be dispatched
- Transaction boundaries are important
- Examples: Ordering

### Use CQRS with MediatR When:
- High separation between reads and writes
- Complex command validation
- Need for audit trails
- Examples: Ordering (already implemented)

## Examples

### User: "Add a query to get catalog items by type"
**Action**: Create extension method with `AsNoTracking()`:
```csharp
public static IQueryable<CatalogItem> ByType(
    this IQueryable<CatalogItem> query, int typeId)
    => query.Where(x => x.TypeId == typeId);
```

### User: "Create a method to get order summary"
**Action**: Use projection in Ordering queries:
```csharp
public async Task<OrderSummary?> GetOrderSummaryAsync(int orderId)
{
    return await _context.Orders
        .AsNoTracking()
        .Where(o => o.Id == orderId)
        .Select(o => new OrderSummary
        {
            Id = o.Id,
            Date = o.OrderDate,
            Status = o.Status.Name,
            Total = o.OrderItems.Sum(i => i.Units * i.UnitPrice)
        })
        .FirstOrDefaultAsync();
}
```

### User: "Add a new aggregate to Ordering"
**Action**: Create repository implementing `IRepository<T>`:
```csharp
public class PaymentRepository : IRepository<Payment>
{
    private readonly OrderingContext _context;

    public IUnitOfWork UnitOfWork => _context;

    public Payment Add(Payment payment)
        => _context.Payments.Add(payment).Entity;

    public async Task<Payment?> GetAsync(int id)
        => await _context.Payments
            .Include(p => p.Transactions)
            .FirstOrDefaultAsync(p => p.Id == id);
}
```
