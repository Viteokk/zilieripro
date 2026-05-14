using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using Ezilier.Domain.Entities;
using FluentValidation.Results;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Application.Handlers.Beneficiaries;

public record CreateBeneficiaryCommand(CreateBeneficiaryRequest Request)
    : IRequest<(BeneficiaryModel? Model, ValidationResult? ValidationResult, int StatusCode)>;

public class CreateBeneficiaryCommandHandler(IDataContext context)
    : IRequestHandler<CreateBeneficiaryCommand, (BeneficiaryModel? Model, ValidationResult? ValidationResult, int StatusCode)>
{
    public async Task<(BeneficiaryModel? Model, ValidationResult? ValidationResult, int StatusCode)> Handle(
        CreateBeneficiaryCommand command, CancellationToken ct)
    {
        var req = command.Request;

        var errors = new List<ValidationFailure>();
        if (string.IsNullOrWhiteSpace(req.CompanyName))
            errors.Add(new ValidationFailure("CompanyName", "Denumirea companiei este obligatorie."));
        if (string.IsNullOrWhiteSpace(req.Idno) || req.Idno.Trim().Length != 13)
            errors.Add(new ValidationFailure("Idno", "IDNO trebuie să conțină exact 13 caractere."));

        if (errors.Count > 0)
            return (null, new ValidationResult(errors), 400);

        var idno = req.Idno!.Trim();

        var existing = await context.Beneficiaries
            .AsNoTracking()
            .FirstOrDefaultAsync(b => b.Idno == idno && !b.IsDeleted, ct);

        if (existing is not null)
            return (null, new ValidationResult([new ValidationFailure("Idno", "Un beneficiar cu acest IDNO este deja înregistrat.")]), 409);

        var beneficiary = new Beneficiary
        {
            Idno = idno,
            CompanyName = req.CompanyName!.Trim(),
            LegalForm = req.LegalForm?.Trim(),
            ActivityType = req.ActivityType?.Trim(),
            Address = req.Address?.Trim(),
            District = req.District?.Trim(),
            Locality = req.Locality?.Trim(),
            Phone = req.Phone?.Trim(),
            Email = req.Email?.Trim(),
        };

        context.Beneficiaries.Add(beneficiary);
        await context.SaveChangesAsync(ct);

        return (new BeneficiaryModel
        {
            Id = beneficiary.Id,
            Idno = beneficiary.Idno,
            CompanyName = beneficiary.CompanyName,
            LegalForm = beneficiary.LegalForm,
            ActivityType = beneficiary.ActivityType,
            Address = beneficiary.Address,
            District = beneficiary.District,
            Locality = beneficiary.Locality,
            Phone = beneficiary.Phone,
            Email = beneficiary.Email,
            WorkerCount = 0,
            VoucherCount = 0,
            CreatedAt = beneficiary.CreatedAt,
        }, null, 201);
    }
}
