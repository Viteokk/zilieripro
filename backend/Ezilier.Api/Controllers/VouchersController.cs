using Ezilier.Application.Handlers.Vouchers;
using Ezilier.Application.Models;
using FluentValidation.Results;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Ezilier.Api.Controllers;

[Authorize]
public class VouchersController : BaseApiController
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] VouchersQueryParams queryParams)
    {
        // Zilier: force scope to their own IDNP (ignore any other beneficiary filter)
        // Inspector: no beneficiary scope (cross-beneficiary access)
        // Angajator: scope by current beneficiary
        Guid? scopeBeneficiaryId = null;
        if (IsZilier)
        {
            queryParams = queryParams with { WorkerIdnp = CurrentIdnp };
        }
        else if (!IsInspector)
        {
            scopeBeneficiaryId = CurrentBeneficiaryId;
        }

        var (model, errors, status) = await Mediator.Send(new GetVouchersQuery(queryParams, scopeBeneficiaryId));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateVoucherRequest request)
    {
        Guid beneficiaryId;
        if (IsInspector)
        {
            if (!request.BeneficiaryId.HasValue || request.BeneficiaryId.Value == Guid.Empty)
                return StatusCode(400, new ValidationResult(
                    [new ValidationFailure("BeneficiaryId", "Compania este obligatorie pentru Inspector.")]));
            beneficiaryId = request.BeneficiaryId.Value;
        }
        else
        {
            beneficiaryId = CurrentBeneficiaryId ?? Guid.Empty;
        }
        var (model, errors, status) = await Mediator.Send(new CreateVouchersCommand(request, beneficiaryId));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var (model, errors, status) = await Mediator.Send(new GetVoucherQuery(id));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Edit(Guid id, [FromBody] EditVoucherRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new EditVoucherCommand(id, request, CurrentIdnp));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id)
    {
        var (model, errors, status) = await Mediator.Send(new ActivateVoucherCommand(id));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("{id:guid}/execute")]
    public async Task<IActionResult> Execute(Guid id)
    {
        var (model, errors, status) = await Mediator.Send(new ExecuteVoucherCommand(id));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("{id:guid}/report")]
    public async Task<IActionResult> Report(Guid id, [FromBody] string reportPeriod)
    {
        var (model, errors, status) = await Mediator.Send(new ReportVoucherCommand(id, reportPeriod));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id, [FromBody] CancelVoucherRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new CancelVoucherCommand(id, request));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpPost("{id:guid}/sign")]
    public async Task<IActionResult> Sign(Guid id, [FromBody] SignVoucherRequest request)
    {
        var (model, errors, status) = await Mediator.Send(new SignVoucherCommand(id, request));
        return StatusCode(status, errors is not null ? errors : model);
    }

    [HttpGet("{id:guid}/activity")]
    public async Task<IActionResult> GetActivity(Guid id)
    {
        var (items, errors, status) = await Mediator.Send(new GetVoucherActivityQuery(id));
        return StatusCode(status, errors is not null ? errors : items);
    }
}
