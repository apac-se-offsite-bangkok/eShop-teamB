---
applyTo: "src/WebApp/**,src/WebAppComponents/**"
---

# WebApp (Blazor) Instructions

## Component Structure

### Page Components

```razor
@page "/items/{itemId:int}"
@inject CatalogService CatalogService
@inject BasketState BasketState
@inject NavigationManager Nav
@attribute [StreamRendering]

<PageTitle>@item?.Name</PageTitle>

<div class="item-page">
    @if (item is null)
    {
        <p>Loading...</p>
    }
    else
    {
        <h1>@item.Name</h1>
    }
</div>

@code {
    private CatalogItem? item;

    [Parameter]
    public int ItemId { get; set; }

    protected override async Task OnInitializedAsync()
    {
        item = await CatalogService.GetItemAsync(ItemId);
    }
}
```

### Reusable Components

```razor
@* Components/Catalog/CatalogListItem.razor *@
<div class="catalog-item">
    <a href="@ItemHelper.Url(Item)">
        <img src="@ProductImages.GetProductImageUrl(Item)" alt="@Item.Name" />
        <span class="catalog-item-name">@Item.Name</span>
        <span class="catalog-item-price">@Item.Price.ToString("C")</span>
    </a>
</div>

@code {
    [Parameter, EditorRequired]
    public required CatalogItem Item { get; set; }

    [Inject]
    public required IProductImageUrlProvider ProductImages { get; set; }
}
```

## State Management

### Observable State Pattern

```csharp
public class BasketState : IBasketState
{
    private readonly HashSet<BasketStateChangedSubscription> _subscriptions = [];
    private BasketItem[]? _cachedBasket;

    public IDisposable NotifyOnChange(EventCallback callback)
    {
        var subscription = new BasketStateChangedSubscription(this, callback);
        _subscriptions.Add(subscription);
        return subscription;
    }

    private async Task NotifySubscribersAsync()
    {
        foreach (var subscription in _subscriptions)
        {
            await subscription.NotifyAsync();
        }
    }

    public async Task AddItemAsync(CatalogItem item)
    {
        _cachedBasket = null; // Invalidate cache
        await _basketService.AddItemAsync(item);
        await NotifySubscribersAsync();
    }
}
```

### Component Subscription

```razor
@implements IDisposable

@code {
    private IDisposable? basketSubscription;
    private int itemCount;

    protected override async Task OnInitializedAsync()
    {
        basketSubscription = Basket.NotifyOnChange(
            EventCallback.Factory.Create(this, UpdateBasketAsync));
        await UpdateBasketAsync();
    }

    private async Task UpdateBasketAsync()
    {
        var items = await Basket.GetBasketItemsAsync();
        itemCount = items.Sum(x => x.Quantity);
        StateHasChanged();
    }

    public void Dispose()
    {
        basketSubscription?.Dispose();
    }
}
```

## Service Registration

```csharp
// Extensions.cs
public static void AddApplicationServices(this IHostApplicationBuilder builder)
{
    // Scoped (per-request)
    builder.Services.AddScoped<BasketState>();
    builder.Services.AddScoped<LogOutService>();

    // Singleton (app-wide)
    builder.Services.AddSingleton<OrderStatusNotificationService>();
    builder.Services.AddSingleton<IProductImageUrlProvider, ProductImageUrlProvider>();

    // HTTP clients with service discovery
    builder.Services.AddHttpClient<CatalogService>(o => 
        o.BaseAddress = new("https+http://catalog-api"))
        .AddApiVersion(2.0)
        .AddAuthToken();
}
```

## Navigation

### Query Parameters

```razor
@code {
    [SupplyParameterFromQuery]
    public int? Page { get; set; }

    [SupplyParameterFromQuery(Name = "brand")]
    public int? BrandId { get; set; }

    private string GetPageUrl(int pageIndex) =>
        Nav.GetUriWithQueryParameter("page", pageIndex == 1 ? null : pageIndex);

    private string GetBrandUrl(int? brandId) =>
        Nav.GetUriWithQueryParameters(new Dictionary<string, object?>
        {
            { "page", null },
            { "brand", brandId }
        });
}
```

### NavLink with Active State

```razor
<NavLink ActiveClass="active-page" Match="@NavLinkMatch.All"
    href="@Nav.GetUriWithQueryParameter("page", pageIndex)">
    @pageIndex
</NavLink>
```

### Programmatic Navigation

```csharp
private async Task AddToCartAsync()
{
    if (!isLoggedIn)
    {
        Nav.NavigateTo(Pages.User.LogIn.Url(Nav));
        return;
    }
    await BasketState.AddItemAsync(item);
}
```

## CSS Conventions

### BEM-inspired Class Naming

```html
<div class="catalog-search">
    <div class="catalog-search-header">
        <h2 class="catalog-search-title">Search</h2>
    </div>
    <div class="catalog-search-group">
        <div class="catalog-search-group-tags">
            <a class="catalog-search-tag @(IsActive ? "active" : "")">All</a>
        </div>
    </div>
</div>
```

### Dynamic Class Binding

```razor
<span class="status @order.Status.ToLower()">@order.Status</span>
<a class="catalog-search-tag @(BrandId == brand.Id ? "active" : "")">@brand.Name</a>
```

## Streaming Rendering

Enable for pages with async data loading:

```razor
@page "/catalog"
@attribute [StreamRendering]

@if (items is null)
{
    <p>Loading...</p>
}
else
{
    @foreach (var item in items)
    {
        <CatalogListItem Item="@item" />
    }
}
```

## Error Handling

```razor
<ErrorBoundary>
    <ChildContent>
        <CatalogList Items="@items" />
    </ChildContent>
    <ErrorContent Context="ex">
        <p class="error">Something went wrong: @ex.Message</p>
    </ErrorContent>
</ErrorBoundary>
```

## Layout Components

```razor
@* MainLayout.razor *@
@inherits LayoutComponentBase

<div class="page">
    <HeaderBar />
    <main>
        @Body
    </main>
    <FooterBar />
</div>

<div id="blazor-error-ui" data-nosnippet>
    An error occurred.
    <a href="" class="reload">Reload</a>
</div>
```
