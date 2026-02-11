---
applyTo: "tests/**"
---

# Testing Instructions

## Unit Tests (MSTest)

Use MSTest with parallel execution:

```csharp
// GlobalUsings.cs
global using Microsoft.VisualStudio.TestTools.UnitTesting;
global using NSubstitute;

[assembly: Parallelize(Workers = 0, Scope = ExecutionScope.MethodLevel)]
```

### Test Class Structure

```csharp
[TestClass]
public class OrderTests
{
    [TestMethod]
    public void Create_order_item_success()
    {
        // Arrange
        var productId = 1;
        var productName = "Test Product";
        var unitPrice = 10.0m;
        
        // Act
        var orderItem = new OrderItem(productId, productName, unitPrice, 0, "", 5);
        
        // Assert
        Assert.IsNotNull(orderItem);
        Assert.AreEqual(productId, orderItem.ProductId);
    }
}
```

### Naming Convention

Use descriptive names: `[Action]_[Scenario]_[ExpectedResult]`

```csharp
[TestMethod]
public void AddOrderItem_WithValidUnits_AddsItemToOrder() { }

[TestMethod]
public void AddOrderItem_WithZeroUnits_ThrowsDomainException() { }

[TestMethod]
public void SetPaidStatus_WhenStockConfirmed_ChangesStatusToPaid() { }
```

## Mocking with NSubstitute

### Setup Pattern

```csharp
[TestClass]
public class CreateOrderCommandHandlerTests
{
    private readonly IOrderRepository _orderRepositoryMock;
    private readonly IIdentityService _identityServiceMock;
    private readonly IMediator _mediatorMock;

    public CreateOrderCommandHandlerTests()
    {
        _orderRepositoryMock = Substitute.For<IOrderRepository>();
        _identityServiceMock = Substitute.For<IIdentityService>();
        _mediatorMock = Substitute.For<IMediator>();
    }
}
```

### Configuring Returns

```csharp
// Simple return
_identityServiceMock.GetUserIdentity().Returns("user-123");

// Task return
_orderRepositoryMock.GetAsync(Arg.Any<int>())
    .Returns(Task.FromResult<Order?>(FakeOrder()));

// Unit of Work
_orderRepositoryMock.UnitOfWork
    .SaveChangesAsync(Arg.Any<CancellationToken>())
    .Returns(Task.FromResult(1));

// Conditional returns
_orderRepositoryMock.GetAsync(Arg.Is<int>(x => x > 0))
    .Returns(Task.FromResult<Order?>(FakeOrder()));
```

## Test Data Builders

Use fluent builders for complex objects:

```csharp
public class OrderBuilder
{
    private readonly Order _order;

    public OrderBuilder(Address address)
    {
        _order = new Order("user-1", "Test User", address, 1, 
            "1234", "123", "Test", DateTime.UtcNow.AddYears(1));
    }

    public OrderBuilder AddItem(int productId, string name, decimal price, int units = 1)
    {
        _order.AddOrderItem(productId, name, price, 0, string.Empty, units);
        return this;
    }

    public Order Build() => _order;
}

// Usage
var order = new OrderBuilder(fakeAddress)
    .AddItem(1, "Cup", 10.0m)
    .AddItem(2, "Plate", 15.0m, 2)
    .Build();
```

## Assertions

### MSTest Assertions

```csharp
Assert.IsNotNull(result);
Assert.AreEqual(expected, actual);
Assert.IsTrue(condition);
Assert.IsFalse(condition);
Assert.ThrowsExactly<OrderingDomainException>(() => order.SetPaidStatus());
Assert.HasCount(3, order.OrderItems);
```

### Collection Assertions

```csharp
Assert.All(items, item => Assert.IsTrue(item.IsValid));
CollectionAssert.Contains(items, expectedItem);
CollectionAssert.AreEquivalent(expected, actual);
```

## Functional Tests (Aspire Integration)

### Fixture Setup

```csharp
public sealed class OrderingApiFixture : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly IHost _app;
    private string? _postgresConnectionString;

    public IResourceBuilder<PostgresServerResource> Postgres { get; private set; }

    public OrderingApiFixture()
    {
        var options = new DistributedApplicationOptions
        {
            AssemblyName = typeof(OrderingApiFixture).Assembly.FullName,
            DisableDashboard = true
        };
        var appBuilder = DistributedApplication.CreateBuilder(options);
        Postgres = appBuilder.AddPostgres("OrderingDB");
        _app = appBuilder.Build();
    }

    public async ValueTask InitializeAsync()
    {
        await _app.StartAsync();
        _postgresConnectionString = await Postgres.Resource.GetConnectionStringAsync();
    }

    public async ValueTask DisposeAsync()
    {
        await _app.StopAsync();
        await _app.DisposeAsync();
    }
}
```

### Functional Test Example

```csharp
[TestClass]
public class OrderingApiTests : IClassFixture<OrderingApiFixture>
{
    private readonly HttpClient _httpClient;

    public OrderingApiTests(OrderingApiFixture fixture)
    {
        _httpClient = fixture.CreateClient();
    }

    [TestMethod]
    public async Task GetOrders_ReturnsSuccess()
    {
        // Act
        var response = await _httpClient.GetAsync("api/orders");

        // Assert
        response.EnsureSuccessStatusCode();
        Assert.AreEqual(HttpStatusCode.OK, response.StatusCode);
    }
}
```

## Test Project Setup

```xml
<Project Sdk="MSTest.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <IsPublishable>false</IsPublishable>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="NSubstitute" />
    <PackageReference Include="NSubstitute.Analyzers.CSharp">
      <PrivateAssets>all</PrivateAssets>
    </PackageReference>
  </ItemGroup>

  <ItemGroup>
    <ProjectReference Include="..\..\src\MyProject\MyProject.csproj" />
  </ItemGroup>
</Project>
```
