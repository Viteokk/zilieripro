using System.Globalization;
using Ezilier.Application.Interfaces;
using Ezilier.Application.Models;
using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace Ezilier.Infrastructure.Services;

public class Ipc21PdfGenerator : IIpc21PdfGenerator
{
    private static readonly NumberFormatInfo IpcNumberFormat = new()
    {
        NumberGroupSeparator = " ", // non-breaking space
        NumberDecimalSeparator = ".",
        NumberDecimalDigits = 2,
    };
    private static bool _customFontsRegistered;
    private static readonly object _fontLock = new();

    public byte[] Generate(Ipc21ReportModel model)
    {
        EnsureCustomFontsRegistered();

        var generatedAt = DateTimeOffset.Now.ToString("dd.MM.yyyy HH:mm");
        var periodStart = model.PeriodStart.ToString("dd.MM.yyyy");
        var periodEnd = model.PeriodEnd.ToString("dd.MM.yyyy");

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(1, Unit.Centimetre);
                page.DefaultTextStyle(t => t.FontFamily(Fonts.Lato).FontSize(8));

                page.Content().Column(col =>
                {
                    col.Item().PaddingBottom(8).Text(text =>
                    {
                        text.AlignCenter();
                        text.Span("Tabelul nr. 2\n").FontSize(11).Bold();
                        text.Span(
                            "Declaratie privind calcularea si utilizarea contributiilor de asigurari sociale " +
                            "de stat obligatorii si informatia privind evidenta nominala a asiguratilor in " +
                            "sistemul public de asigurari sociale\n").FontSize(9).Bold();
                        text.Span($"Perioada raportata: {periodStart} – {periodEnd}").FontSize(8);
                    });

                    if (model.Lines.Count == 0)
                    {
                        col.Item().PaddingTop(40).AlignCenter().Text("Fara date pentru perioada selectata")
                            .FontSize(11).Italic();
                        return;
                    }

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(c =>
                        {
                            c.RelativeColumn(0.6f);  // 1 - Nr.
                            c.RelativeColumn(2.2f);  // 2 - Nume Prenume
                            c.RelativeColumn(1.6f);  // 3 - IDNP
                            c.RelativeColumn(1.0f);  // 4 - CPAS
                            c.RelativeColumn(1.1f);  // 5 - Perioada de la
                            c.RelativeColumn(1.1f);  // 6 - pana la
                            c.RelativeColumn(2.6f);  // 7 - Categoria
                            c.RelativeColumn(0.8f);  // 7' - Tarif
                            c.RelativeColumn(2.4f);  // 8 - Functia
                            c.RelativeColumn(1.4f);  // 9 - Baza de calcul
                            c.RelativeColumn(1.4f);  // 10 - Indemnizatie
                            c.RelativeColumn(1.4f);  // 11 - Contributia
                        });

                        table.Header(header =>
                        {
                            string[] colNumbers = ["1", "2", "3", "4", "5", "6", "7", "7'", "8", "9", "10", "11"];
                            string[] colTitles =
                            [
                                "Nr. crt.",
                                "Numele, prenumele persoanei asigurate",
                                "Numarul de identificare al persoanei asigurate (IDNP)",
                                "Cod personal de asigurare sociala (CPAS)",
                                "Perioada de munca - de la data de",
                                "pana la data de",
                                "Categoria persoanei asigurate",
                                "Tariful contributiei (%)",
                                "Codul functiei",
                                "Baza de calcul a contributiei de asigurari sociale",
                                "Indemnizatia pentru incapacitatea temporara de munca",
                                "Contributia de asigurari sociale calculata"
                            ];
                            foreach (var n in colNumbers)
                            {
                                header.Cell().Border(0.5f).Padding(2).AlignCenter().AlignMiddle()
                                    .Text(n).Bold().FontSize(7);
                            }
                            foreach (var title in colTitles)
                            {
                                header.Cell().Border(0.5f).Padding(2).AlignCenter().AlignMiddle()
                                    .Text(title).Bold().FontSize(6.5f);
                            }
                        });

                        for (var i = 0; i < model.Lines.Count; i++)
                        {
                            var line = model.Lines[i];

                            table.Cell().Border(0.5f).Padding(2).AlignCenter().AlignMiddle()
                                .Text((i + 3).ToString()).FontSize(7);
                            table.Cell().Border(0.5f).Padding(2).AlignMiddle()
                                .Text(line.WorkerFullName).FontSize(7);
                            table.Cell().Border(0.5f).Padding(2).AlignMiddle()
                                .Text(line.WorkerIdnp).FontFamily(Fonts.CourierNew).FontSize(7);
                            table.Cell().Border(0.5f).Padding(2).AlignMiddle()
                                .Text(line.Cpas ?? string.Empty).FontSize(7);
                            table.Cell().Border(0.5f).Padding(2).AlignCenter().AlignMiddle()
                                .Text(periodStart).FontSize(7);
                            table.Cell().Border(0.5f).Padding(2).AlignCenter().AlignMiddle()
                                .Text(periodEnd).FontSize(7);
                            table.Cell().Border(0.5f).Padding(2).AlignMiddle()
                                .Text($"{line.InsuredPersonCategoryCode} - {line.InsuredPersonCategoryDescription}")
                                .FontSize(6.5f);
                            table.Cell().Border(0.5f).Padding(2).AlignCenter().AlignMiddle()
                                .Text(line.ContributionRate).FontSize(7);
                            table.Cell().Border(0.5f).Padding(2).AlignMiddle()
                                .Text($"{line.FunctionCode} - {line.FunctionDescription}").FontSize(6.5f);
                            table.Cell().Border(0.5f).Padding(2).AlignRight().AlignMiddle()
                                .Text(FormatDecimal(line.ContributionBase)).FontSize(7);
                            table.Cell().Border(0.5f).Padding(2).AlignRight().AlignMiddle()
                                .Text(FormatDecimal(line.TemporaryIncapacityIndemnity)).FontSize(7);
                            table.Cell().Border(0.5f).Padding(2).AlignRight().AlignMiddle()
                                .Text(FormatDecimal(line.CalculatedContribution)).FontSize(7);
                        }
                    });
                });

                page.Footer().Row(row =>
                {
                    row.RelativeItem().Text(text =>
                    {
                        text.Span("Pagina ").FontSize(7);
                        text.CurrentPageNumber().FontSize(7);
                        text.Span(" din ").FontSize(7);
                        text.TotalPages().FontSize(7);
                    });
                    row.RelativeItem().AlignRight().Text($"Generat la {generatedAt}").FontSize(7);
                });
            });
        }).GeneratePdf();
    }

    private static string FormatDecimal(decimal value) => value.ToString("N2", IpcNumberFormat);

    private static void EnsureCustomFontsRegistered()
    {
        if (_customFontsRegistered) return;
        lock (_fontLock)
        {
            if (_customFontsRegistered) return;
            try
            {
                var fontsDir = Path.Combine(AppContext.BaseDirectory, "Resources", "Fonts");
                if (Directory.Exists(fontsDir))
                {
                    foreach (var ttf in Directory.EnumerateFiles(fontsDir, "*.ttf"))
                    {
                        using var stream = File.OpenRead(ttf);
                        FontManager.RegisterFont(stream);
                    }
                }
            }
            catch
            {
                // Falls back silently to bundled Lato when registration fails.
            }
            _customFontsRegistered = true;
        }
    }
}
