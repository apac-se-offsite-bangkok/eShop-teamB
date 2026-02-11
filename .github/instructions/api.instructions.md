---
applyTo: "src/**/*Api*/**,src/**/Api/**,**/*Api.cs"
---

# API Development Instructions

## Endpoint Definition

Use **Minimal APIs** with route groups and versioning:

```csharp
public static class MyApi
{
    public static IEndpointRouteBuilder MapMyApi(this IEndpointRouteBuilder app)
    {
        var vApi = app.NewVersionedApi("MyService");
        var v1 = vApi.MapGroup("api/myservice").HasApiVersion(1, 0);
        var v2 = vApi.MapGroup("api/myservice").HasApiVersion(2, 0);

        v1.MapGet("/items", GetItemsV1).WithName("GetItems");
        v2.MapGet("/items", GetItemsV2).WithName("GetItems-V2");
        
        return app;
    }
}
```

## Typed Results

Always use `Results<T1, T2, ...>` for compile-time safety and OpenAPI generation:

```csharp
public static async Task<Results<Ok<ItemDto>, NotFound, BadRequest<ProblemDetails>>> 
    GetItemById(
        [AsParameters] MyServices services,
        [Description("The item id")] int id)
{
    if (id <= 0)
        return TypedResults.BadRequest<ProblemDetails>(new() { Detail = "Id is not valid" });
    
    var item = await services.Context.Items.FindAsync(id);
    return item is null ? TypedResults.NotFound() : TypedResults.Ok(item.ToDto());
}
```

## Parameter Aggregation

Group related dependencies using `[AsParameters]`:

```csharp
public class MyServices(
    MyDbContext context,
    ILogger<MyServices> logger,
    IOptions<MyOptions> options)
{
    public MyDbContext Context { get; } = context;
    public ILogger<MyServices> Logger { get; } = logger;
}

// Usage in endpoint
public static async Task<Ok<List<Item>>> GetItems([AsParameters] MyServices services)
```

## Endpoint Metadata

Always include metadata for documentation:

```csharp
v1.MapGet("/items", GetItems)
    .WithName("GetItems")
    .WithSummary("List all items")
    .WithDescription("Get a paginated list of items.")
    .WithTags("Items");
```

## Error Handling

Use ProblemDetails for error responses:

```csharp
// Attribute for OpenAPI
[ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest, "application/problem+json")]

// In endpoint
return TypedResults.Problem(detail: "Operation failed", statusCode: 500);
```

## Request ID Header

For idempotent operations, require request ID:

```csharp
public static async Task<Results<Ok, BadRequest<string>>> ProcessCommand(
    [FromHeader(Name = "x-requestid")] Guid requestId,
    MyCommand command,
    [AsParameters] MyServices services)
{
    if (requestId == Guid.Empty)
        return TypedResults.BadRequest("Empty GUID is not valid for request ID");
    // ...
}
```

## OpenAPI Setup

Register in Program.cs:

```csharp
var withApiVersioning = builder.Services.AddApiVersioning();
builder.AddDefaultOpenApi(withApiVersioning);

// After app.Build()
app.UseDefaultOpenApi();
app.MapMyApi();
```

## Authorization

Add authorization requirements to protected endpoints:

```csharp
var api = vApi.MapGroup("api/orders")
    .HasApiVersion(1.0)
    .RequireAuthorization();
```
