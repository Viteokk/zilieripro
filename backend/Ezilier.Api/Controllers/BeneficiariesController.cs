using Ezilier.Application.Handlers.Beneficiaries;
using Ezilier.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ezilier.Api.Controllers;

[Authorize]
public class BeneficiariesController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? search, [FromQuery] int offset = 0, [FromQuery] int limit = 25)
    {
        var result = await Mediator.Send(new GetBeneficiariesQuery(search, offset, limit));
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBeneficiaryRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new CreateBeneficiaryCommand(request));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterBeneficiaryRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new RegisterBeneficiaryCommand(request));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (model, errors, status) = await Mediator.Send(new GetBeneficiaryQuery(id));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("{id:guid}/link-user")]
    public async Task<IActionResult> LinkUser(Guid id, [FromBody] LinkUserRequest request)
    {
        var (success, errors, status) = await Mediator.Send(new LinkUserToBeneficiaryCommand(id, request.Idnp));
        return StatusCode(status, errors is not null ? errors : new { success });
    }
}
