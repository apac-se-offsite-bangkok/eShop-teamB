---
name: security
description: 'Enforce security best practices in .NET applications. Use this skill when writing authentication, authorization, data protection, or any code handling user input. It prevents common vulnerabilities like SQL injection, XSS, CSRF, and ensures secure configuration.'
---

# Security Best Practices

## Overview

This skill ensures secure coding practices across eShop .NET microservices. It covers authentication, data protection, attack prevention, and secure configuration patterns.

## Prerequisites

- ASP.NET Core Identity or Duende IdentityServer (already configured in eShop)
- Entity Framework Core for parameterized queries
- Data Protection API for encryption

## Core Rules

1. **NEVER** store plaintext passwords — always use hashed and salted passwords.
2. **NEVER** expose detailed exception messages to end users.
3. **NEVER** trust user input — always validate and sanitize.
4. **NEVER** store secrets in `appsettings.json` — use User Secrets or Azure Key Vault.
5. **ALWAYS** use parameterized queries or Entity Framework (never string concatenation for SQL).
6. **ALWAYS** use HTTPS and enable HSTS in production.

## Workflows

### Checking for Vulnerable Packages

Run regularly to detect known vulnerabilities:

```bash
dotnet list package --vulnerable
```

**Action**: Update any vulnerable packages immediately.

### Adding Authentication to an Endpoint

```csharp
// ✅ Correct: Require authorization
var api = app.MapGroup("api/orders")
    .HasApiVersion(1.0)
    .RequireAuthorization();

// For specific policies
api.MapPost("/admin", AdminAction)
    .RequireAuthorization("AdminPolicy");

// ❌ Wrong: Unprotected sensitive endpoint
app.MapPost("/api/orders", CreateOrder); // No auth!
```

### Preventing SQL Injection

```csharp
// ✅ Correct: Parameterized query with EF Core
var items = await context.CatalogItems
    .Where(x => x.Name.Contains(searchTerm))
    .ToListAsync();

// ✅ Correct: Raw SQL with parameters
var items = await context.CatalogItems
    .FromSqlInterpolated($"SELECT * FROM Items WHERE Name LIKE {searchTerm}")
    .ToListAsync();

// ❌ DANGEROUS: String concatenation
var items = await context.CatalogItems
    .FromSqlRaw($"SELECT * FROM Items WHERE Name LIKE '{searchTerm}'")
    .ToListAsync();
```

### Preventing Cross-Site Scripting (XSS)

```razor
@* ✅ Correct: Razor auto-encodes *@
<p>@userInput</p>

@* ❌ DANGEROUS: Raw HTML rendering *@
<p>@Html.Raw(userInput)</p>
```

In API responses, ensure proper content-type headers:
```csharp
return TypedResults.Ok(new { message = userInput }); // JSON encoded
```

### Preventing CSRF in Forms

```csharp
// For MVC/Razor Pages
[ValidateAntiForgeryToken]
public async Task<IActionResult> UpdateProfile(ProfileModel model)

// For Blazor forms - automatic with EditForm
<EditForm Model="@profile" OnValidSubmit="HandleSubmit">
    <AntiforgeryToken />
</EditForm>
```

### Secure Configuration

```csharp
// Program.cs - Security headers middleware
app.UseHsts();
app.UseHttpsRedirection();

// Add security headers
app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    await next();
});
```

### Protecting Sensitive Data

```csharp
// Use Data Protection API for encryption
public class SecureService(IDataProtector protector)
{
    public string Protect(string data) => protector.Protect(data);
    public string Unprotect(string data) => protector.Unprotect(data);
}

// Registration
builder.Services.AddDataProtection()
    .PersistKeysToAzureBlobStorage(connectionString, containerName, blobName);
```

### Secure Error Handling

```csharp
// ✅ Correct: Generic error for users, detailed logging
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        
        logger.LogError(exception, "Unhandled exception"); // Detailed log
        
        context.Response.StatusCode = 500;
        await context.Response.WriteAsJsonAsync(new 
        { 
            error = "An error occurred" // Generic message
        });
    });
});

// ❌ DANGEROUS: Exposing stack trace
app.UseDeveloperExceptionPage(); // Only in Development!
```

### Validating User Input

```csharp
// Use FluentValidation
public class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.City).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Street).NotEmpty().MaximumLength(200);
        RuleFor(x => x.CardNumber).CreditCard();
        RuleFor(x => x.CardExpiration).GreaterThan(DateTime.UtcNow);
    }
}
```

### Preventing Open Redirects

```csharp
// ✅ Correct: Validate redirect URL
public IActionResult Login(string returnUrl)
{
    if (Url.IsLocalUrl(returnUrl))
    {
        return Redirect(returnUrl);
    }
    return RedirectToAction("Index", "Home");
}

// ❌ DANGEROUS: Unvalidated redirect
return Redirect(returnUrl); // Could redirect to malicious site
```

## Attack Prevention Summary

| Attack | Prevention |
|--------|------------|
| SQL Injection | Parameterized queries, EF Core |
| XSS | Razor encoding, avoid `Html.Raw()` |
| CSRF | `[ValidateAntiForgeryToken]`, `<AntiforgeryToken />` |
| Open Redirect | `Url.IsLocalUrl()` validation |
| Path Traversal | Never use user input for file paths |
| Sensitive Data Exposure | Data Protection API, Key Vault |

## Security Checklist

- [ ] All endpoints have appropriate authorization
- [ ] No vulnerable NuGet packages (`dotnet list package --vulnerable`)
- [ ] HTTPS enforced with HSTS
- [ ] Secrets stored in User Secrets or Key Vault
- [ ] Input validation on all user-provided data
- [ ] No detailed errors exposed to users
- [ ] Security headers configured
- [ ] Anti-forgery tokens on state-changing forms

## Key Resources

- [Microsoft .NET Security Best Practices](https://learn.microsoft.com/en-us/dotnet/architecture/secure-devops/developer-security-best-practices)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Microsoft Security Response Center](https://msrc.microsoft.com/)
