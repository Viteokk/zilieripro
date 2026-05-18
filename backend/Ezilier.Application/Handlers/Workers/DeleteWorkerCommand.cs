using Ezilier.Application.Interfaces;
using FluentValidation.Results;
using MediatR;

namespace Ezilier.Application.Handlers.Workers;

public record DeleteWorkerCommand(Guid WorkerId)
    : IRequest<(bool Success, ValidationResult? Error, int StatusCode)>;

public class DeleteWorkerCommandHandler(IDataContext context)
    : IRequestHandler<DeleteWorkerCommand, (bool Success, ValidationResult? Error, int StatusCode)>
{
    public async Task<(bool Success, ValidationResult? Error, int StatusCode)> Handle(
        DeleteWorkerCommand command, CancellationToken cancellationToken)
    {
        var worker = await context.Workers.FindAsync([command.WorkerId], cancellationToken);
        if (worker is null)
            return (false, null, 404);

        context.Workers.Remove(worker);
        await context.SaveChangesAsync(cancellationToken);
        return (true, null, 204);
    }
}
