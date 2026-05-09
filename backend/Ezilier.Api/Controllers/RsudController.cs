using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ezilier.Api.Controllers;

// Mock RSUD integration (MConnect). In production this would call the real MConnect
// service and return all legal entities linked to the current user's IDNP.
[Authorize]
public class RsudController : BaseApiController
{
    // Deterministic mock: returns a stable list of companies per IDNP.
    [HttpGet("companies")]
    public IActionResult GetCompaniesForCurrentUser()
    {
        var idnp = CurrentIdnp;
        if (string.IsNullOrWhiteSpace(idnp))
        {
            return Ok(Array.Empty<object>());
        }

        // Hash the IDNP to decide how many companies this user has (1..3)
        var hash = 0;
        foreach (var c in idnp) hash = (hash * 31 + c) & 0x7fffffff;
        var count = Math.Max(2, (hash % 3) + 1);

        var results = new List<object>();
        var activities = new[] { "Agricultura", "Horticultura", "Constructii", "Comert cu amanuntul", "Silvicultura" };
        var legalForms = new[] { "SRL", "II", "GTG", "SA", "Cooperativa" };
        var roles = new[] { "Administrator", "Fondator", "Asociat", "Reprezentant" };
        var cities = new[] { "mun. Chisinau", "mun. Balti", "or. Orhei", "or. Ungheni", "or. Cahul" };
        var streets = new[] { "str. Stefan cel Mare 1", "str. Calea Iesilor 25", "str. 31 August 12", "str. Vasile Lupu 7" };

        for (var i = 0; i < count; i++)
        {
            var seed = hash + i * 7919;
            var idno = $"10{((seed % 90_000_000) + 10_000_000):00000000}";
            // Roughly 1-in-3 entries are 'Radiat' (legal entity de-registered) so
            // the picker can show them as disabled — but we always guarantee that
            // the FIRST company is Activ, so every user has at least one usable
            // option.
            var status = i == 0 ? "Activ" : (((seed / 7) % 3) == 0 ? "Radiat" : "Activ");
            results.Add(new
            {
                Idno = idno,
                CompanyName = $"SRL Agro-{(char)('A' + (seed % 26))}{(char)('A' + ((seed / 26) % 26))}{((seed / 100) % 99):00}",
                LegalForm = legalForms[seed % legalForms.Length],
                ActivityType = activities[seed % activities.Length],
                Address = $"{cities[seed % cities.Length]}, {streets[seed % streets.Length]}",
                Role = roles[seed % roles.Length],
                Status = status,
            });
        }

        return Ok(results);
    }
}
