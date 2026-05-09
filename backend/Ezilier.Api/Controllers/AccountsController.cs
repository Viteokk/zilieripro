using Ezilier.Application.Handlers.Auth;
using Ezilier.Application.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ezilier.Api.Controllers;

public class AccountsController : BaseApiController
{
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new LoginCommand { Request = request });
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("refresh")]
    public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new RefreshTokenCommand { Request = request });
        return StatusCode(status, errors is not null ? errors : model);
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var (model, errors, status) = await Mediator.Send(new GetCurrentUserQuery { UserId = CurrentUserId, BeneficiaryId = CurrentBeneficiaryId });
        return StatusCode(status, errors is not null ? errors : model);
    }

    [Authorize]
    [HttpPost("switch-company")]
    public async Task<IActionResult> SwitchCompany([FromBody] SwitchCompanyRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new SwitchCompanyCommand(CurrentUserId, request.BeneficiaryId));
        return StatusCode(status, errors is not null ? errors : model);
    }
}
