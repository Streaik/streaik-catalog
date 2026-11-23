using System.Text.Json.Nodes;

namespace Streaik.Catalog;

public static class ProviderCatalog
{
    public static JsonArray ReadProviderIndex() => Read("providers/index.json")?.AsArray()
        ?? throw new InvalidOperationException("The catalog provider index was not embedded.");

    public static JsonObject? ReadProvider(string providerId)
    {
        var entry = ReadProviderIndex().FirstOrDefault(item => item?["id"]?.GetValue<string>() == providerId);
        return entry?["file"]?.GetValue<string>() is { } file ? Read($"providers/{file}")?.AsObject() : null;
    }

    public static JsonObject? ReadPricing(string providerId) => Read($"pricing/providers/{providerId}.json")?.AsObject();

    private static JsonNode? Read(string resource)
    {
        using var stream = typeof(ProviderCatalog).Assembly.GetManifestResourceStream(resource);
        return stream is null ? null : JsonNode.Parse(stream);
    }
}
