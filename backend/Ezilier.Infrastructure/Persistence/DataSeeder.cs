using Ezilier.Domain;
using Ezilier.Domain.Entities;
using Ezilier.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Ezilier.Infrastructure.Persistence;

public static class DataSeeder
{
    public static async Task SeedAsync(DataContext context)
    {
        // Idempotent additive seed for activity-type nomenclators (runs every startup
        // so that existing prod DBs pick up the expanded list without a full re-seed).
        await SeedActivityTypesAsync(context);
        await SeedCaemActivityTypesAsync(context);

        if (await context.Roles.AnyAsync())
            return;

        // ── Roles ──
        var roleAngajator = new Role { Id = Guid.Parse("a1000000-0000-0000-0000-000000000001"), Key = Constants.Roles.Angajator, Title = "Angajator", Description = "Beneficiar - angajator de zilieri", Type = RoleType.Angajator };
        var roleInspector = new Role { Id = Guid.Parse("a1000000-0000-0000-0000-000000000002"), Key = Constants.Roles.Inspector, Title = "Inspector ISM", Description = "Inspectia de Stat a Muncii", Type = RoleType.Inspector };
        var roleAdmin = new Role { Id = Guid.Parse("a1000000-0000-0000-0000-000000000003"), Key = Constants.Roles.Administrator, Title = "Administrator", Description = "Administrator tehnic al sistemului", Type = RoleType.Administrator };
        var roleZilier = new Role { Id = Guid.Parse("a1000000-0000-0000-0000-000000000004"), Key = Constants.Roles.Zilier, Title = "Zilier", Description = "Lucrator zilier", Type = RoleType.Zilier };

        context.Roles.AddRange(roleAngajator, roleInspector, roleAdmin, roleZilier);

        // ── Permissions ──
        var permissions = new List<Permission>();
        void AddPerm(Role role, string key, string title) =>
            permissions.Add(new Permission { Key = key, Title = title, RoleId = role.Id });

        // Angajator permissions
        AddPerm(roleAngajator, Constants.Permissions.VouchersFull, "Gestionare completa vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersCreate, "Creare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersView, "Vizualizare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersEdit, "Editare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersActivate, "Activare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersExecute, "Executare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersReport, "Raportare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.VouchersCancel, "Anulare vouchere");
        AddPerm(roleAngajator, Constants.Permissions.WorkersFull, "Gestionare lucratori");
        AddPerm(roleAngajator, Constants.Permissions.ReportsView, "Vizualizare rapoarte");

        // Inspector permissions
        AddPerm(roleInspector, Constants.Permissions.VouchersView, "Vizualizare vouchere");
        AddPerm(roleInspector, Constants.Permissions.WorkersView, "Vizualizare lucratori");
        AddPerm(roleInspector, Constants.Permissions.ReportsView, "Vizualizare rapoarte");
        AddPerm(roleInspector, Constants.Permissions.CrossBeneficiaryView, "Vizualizare cross-beneficiar");

        // Admin permissions
        AddPerm(roleAdmin, Constants.Permissions.UsersFull, "Gestionare completa utilizatori");
        AddPerm(roleAdmin, Constants.Permissions.SystemParametersFull, "Gestionare parametri sistem");
        AddPerm(roleAdmin, Constants.Permissions.NomenclatorsFull, "Gestionare nomenclatoare");
        AddPerm(roleAdmin, Constants.Permissions.AuditView, "Vizualizare jurnal audit");
        AddPerm(roleAdmin, Constants.Permissions.ReportsFull, "Gestionare completa rapoarte");

        // Zilier permissions
        AddPerm(roleZilier, Constants.Permissions.VouchersView, "Vizualizare vouchere proprii");

        context.Permissions.AddRange(permissions);

        // ── Beneficiaries ──
        var ben1 = new Beneficiary { Id = Guid.Parse("b1000000-0000-0000-0000-000000000001"), Idno = "1003600012345", CompanyName = "SRL AgriSud", LegalForm = "SRL", ActivityType = "Agricultura", Address = "str. Stefan cel Mare 123", District = "Chisinau", Locality = "Chisinau" };
        var ben2 = new Beneficiary { Id = Guid.Parse("b1000000-0000-0000-0000-000000000002"), Idno = "1003600012346", CompanyName = "SRL ConstructPlus", LegalForm = "SRL", ActivityType = "Constructii", Address = "str. Independentei 45", District = "Balti", Locality = "Balti" };

        context.Beneficiaries.AddRange(ben1, ben2);

        // ── Users ──
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("parola123");

        // Employer user
        var userEmp = new User { Id = Guid.Parse("c1000000-0000-0000-0000-000000000001"), Idnp = "2003400111111", FirstName = "Ion", LastName = "Popescu", Email = "ion.popescu@test.md", Phone = "+37360123456" };
        var identEmp = new UserIdentity { UserId = userEmp.Id, RoleId = roleAngajator.Id, BeneficiaryId = ben1.Id, PasswordHash = passwordHash, Status = UserStatus.Active };
        context.Users.Add(userEmp);
        context.UserIdentities.Add(identEmp);

        // Inspector user
        var userIns = new User { Id = Guid.Parse("c1000000-0000-0000-0000-000000000002"), Idnp = "2003400222222", FirstName = "Maria", LastName = "Ionescu", Email = "maria.ionescu@ism.gov.md", Phone = "+37360123457" };
        var identIns = new UserIdentity { UserId = userIns.Id, RoleId = roleInspector.Id, PasswordHash = passwordHash, Status = UserStatus.Active, AssignedDistricts = "Chisinau,Balti,Cahul,Orhei" };
        context.Users.Add(userIns);
        context.UserIdentities.Add(identIns);

        // Admin user
        var userAdm = new User { Id = Guid.Parse("c1000000-0000-0000-0000-000000000003"), Idnp = "2003400333333", FirstName = "Vasile", LastName = "Rusu", Email = "vasile.rusu@admin.gov.md", Phone = "+37360123458" };
        var identAdm = new UserIdentity { UserId = userAdm.Id, RoleId = roleAdmin.Id, PasswordHash = passwordHash, Status = UserStatus.Active };
        context.Users.Add(userAdm);
        context.UserIdentities.Add(identAdm);

        // Zilier user
        var userZil = new User { Id = Guid.Parse("c1000000-0000-0000-0000-000000000004"), Idnp = "2003400444444", FirstName = "Elena", LastName = "Moraru", Email = "elena.moraru@test.md", Phone = "+37360123459" };
        var identZil = new UserIdentity { UserId = userZil.Id, RoleId = roleZilier.Id, PasswordHash = passwordHash, Status = UserStatus.Active };
        context.Users.Add(userZil);
        context.UserIdentities.Add(identZil);

        // ── Workers ──
        var worker1 = new Worker { Id = Guid.Parse("d1000000-0000-0000-0000-000000000001"), Idnp = "2003400444444", FirstName = "Elena", LastName = "Moraru", BirthDate = new DateOnly(1995, 1, 30), Phone = "+37360123459", Email = "elena.moraru@test.md", BeneficiaryId = ben1.Id, RspValidated = true, RspValidatedAt = DateTimeOffset.UtcNow };
        var worker2 = new Worker { Id = Guid.Parse("d1000000-0000-0000-0000-000000000002"), Idnp = "2003400555555", FirstName = "Andrei", LastName = "Cojocaru", BirthDate = new DateOnly(1988, 6, 12), Phone = "+37360123460", BeneficiaryId = ben1.Id, RspValidated = true, RspValidatedAt = DateTimeOffset.UtcNow };
        var worker3 = new Worker { Id = Guid.Parse("d1000000-0000-0000-0000-000000000003"), Idnp = "2003400666666", FirstName = "Ana", LastName = "Lungu", BirthDate = new DateOnly(2000, 9, 18), Phone = "+37360123461", BeneficiaryId = ben1.Id, RspValidated = true, RspValidatedAt = DateTimeOffset.UtcNow };

        context.Workers.AddRange(worker1, worker2, worker3);

        // ── Demo Vouchers ──
        var taxService = new Application.Services.TaxCalculationService();

        void AddVoucher(Worker w, DateOnly date, int hours, decimal net, VoucherStatus status, Beneficiary ben)
        {
            var (tax, cnas, gross) = taxService.Calculate(net);
            var v = new Voucher
            {
                Code = $"VCH-{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
                BeneficiaryId = ben.Id,
                WorkerId = w.Id,
                Status = status,
                WorkDate = date,
                HoursWorked = hours,
                NetRemuneration = net,
                IncomeTax = tax,
                CnasContribution = cnas,
                GrossRemuneration = gross,
                WorkDistrict = ben.District ?? "Chisinau",
                WorkLocality = ben.Locality ?? "Chisinau",
                WorkAddress = ben.Address,
                RspValidated = true,
                Art5Alin1LitB = true,
                Art5Alin1LitG = true,
                CreatedBy = userEmp.Id
            };
            if (status >= VoucherStatus.Activ) v.ActivatedAt = DateTimeOffset.UtcNow.AddDays(-2);
            if (status >= VoucherStatus.Executat) v.ExecutedAt = DateTimeOffset.UtcNow.AddDays(-1);
            if (status >= VoucherStatus.Raportat) { v.ReportedAt = DateTimeOffset.UtcNow; v.ReportPeriod = date.ToString("yyyy-MM"); }
            context.Vouchers.Add(v);
        }

        AddVoucher(worker1, new DateOnly(2026, 4, 1), 8, 250, VoucherStatus.Raportat, ben1);
        AddVoucher(worker1, new DateOnly(2026, 4, 2), 8, 250, VoucherStatus.Executat, ben1);
        AddVoucher(worker1, new DateOnly(2026, 4, 3), 6, 200, VoucherStatus.Activ, ben1);
        AddVoucher(worker2, new DateOnly(2026, 4, 1), 8, 300, VoucherStatus.Raportat, ben1);
        AddVoucher(worker2, new DateOnly(2026, 4, 2), 8, 300, VoucherStatus.Activ, ben1);
        AddVoucher(worker3, new DateOnly(2026, 4, 1), 5, 150, VoucherStatus.Emis, ben1);
        AddVoucher(worker3, new DateOnly(2026, 4, 3), 7, 200, VoucherStatus.Emis, ben1);

        // ── System Parameters ──
        context.SystemParameters.AddRange(
            new SystemParameter { Key = Constants.SystemParams.YearlyWorkerVoucherLimit, Value = "120", Description = "Limita anuala de vouchere per lucrator per beneficiar", ValueType = "int" },
            new SystemParameter { Key = Constants.SystemParams.IncomeTaxRate, Value = "0.12", Description = "Rata impozitului pe venit (12%)", ValueType = "decimal" },
            new SystemParameter { Key = Constants.SystemParams.CnasRate, Value = "0.06", Description = "Rata contributiei CNAS (6%)", ValueType = "decimal" },
            new SystemParameter { Key = Constants.SystemParams.MinimumSalary, Value = "100", Description = "Salariul minim zilnic (MDL)", ValueType = "decimal" }
        );

        // ── Nomenclators ──
        context.Nomenclators.AddRange(
            // Cancellation reasons
            new Nomenclator { Category = Constants.NomenclatorCategories.CancellationReasons, Code = "CA-01", TitleRo = "Renuntare din partea angajatorului", TitleRu = "Отказ работодателя", TitleEn = "Employer withdrawal", SortOrder = 1 },
            new Nomenclator { Category = Constants.NomenclatorCategories.CancellationReasons, Code = "CA-02", TitleRo = "Renuntare din partea zilierului", TitleRu = "Отказ работника", TitleEn = "Worker withdrawal", SortOrder = 2 },
            new Nomenclator { Category = Constants.NomenclatorCategories.CancellationReasons, Code = "CA-03", TitleRo = "Eroare la emitere", TitleRu = "Ошибка выдачи", TitleEn = "Issuance error", SortOrder = 3 },

            // Districts
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "CHI", TitleRo = "Chisinau", TitleRu = "Кишинёв", TitleEn = "Chisinau", SortOrder = 1 },
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "BAL", TitleRo = "Balti", TitleRu = "Бельцы", TitleEn = "Balti", SortOrder = 2 },
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "CAH", TitleRo = "Cahul", TitleRu = "Кагул", TitleEn = "Cahul", SortOrder = 3 },
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "ORH", TitleRo = "Orhei", TitleRu = "Орхей", TitleEn = "Orhei", SortOrder = 4 },
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "UNG", TitleRo = "Ungheni", TitleRu = "Унгены", TitleEn = "Ungheni", SortOrder = 5 },
            new Nomenclator { Category = Constants.NomenclatorCategories.Districts, Code = "SOR", TitleRo = "Soroca", TitleRu = "Сорока", TitleEn = "Soroca", SortOrder = 6 },

            // Activity types
            new Nomenclator { Category = Constants.NomenclatorCategories.ActivityTypes, Code = "AGR", TitleRo = "Agricultura", TitleRu = "Сельское хозяйство", TitleEn = "Agriculture", SortOrder = 1 },
            new Nomenclator { Category = Constants.NomenclatorCategories.ActivityTypes, Code = "CON", TitleRo = "Constructii", TitleRu = "Строительство", TitleEn = "Construction", SortOrder = 2 },
            new Nomenclator { Category = Constants.NomenclatorCategories.ActivityTypes, Code = "COM", TitleRo = "Comert", TitleRu = "Торговля", TitleEn = "Commerce", SortOrder = 3 },
            new Nomenclator { Category = Constants.NomenclatorCategories.ActivityTypes, Code = "SER", TitleRo = "Servicii", TitleRu = "Услуги", TitleEn = "Services", SortOrder = 4 },

            // Legal forms
            new Nomenclator { Category = Constants.NomenclatorCategories.LegalForms, Code = "SRL", TitleRo = "Societate cu raspundere limitata", TitleRu = "ООО", TitleEn = "LLC", SortOrder = 1 },
            new Nomenclator { Category = Constants.NomenclatorCategories.LegalForms, Code = "SA", TitleRo = "Societate pe actiuni", TitleRu = "АО", TitleEn = "JSC", SortOrder = 2 },
            new Nomenclator { Category = Constants.NomenclatorCategories.LegalForms, Code = "II", TitleRo = "Intreprindere individuala", TitleRu = "ИП", TitleEn = "Sole proprietorship", SortOrder = 3 },
            new Nomenclator { Category = Constants.NomenclatorCategories.LegalForms, Code = "GC", TitleRo = "Gospodarie taraneasca", TitleRu = "КХ", TitleEn = "Farm household", SortOrder = 4 }
        );

        await context.SaveChangesAsync();
    }

    // Adds Art. 13-aligned activity types if the corresponding code is missing.
    // Safe to run on every startup — only inserts what's not yet present.
    private static async Task SeedActivityTypesAsync(DataContext context)
    {
        var desired = new[]
        {
            new { Code = "AGR-CULES",     Ro = "Cules de fructe / legume",       Ru = "Сбор фруктов / овощей",          En = "Fruit / vegetable picking",   Order = 10 },
            new { Code = "AGR-PLANTARE",  Ro = "Plantare si rasadire",           Ru = "Посадка и рассада",              En = "Planting and seedlings",      Order = 11 },
            new { Code = "AGR-PRASIT",    Ro = "Prasit, plivit, sapat",          Ru = "Прополка, рыхление",             En = "Hoeing and weeding",          Order = 12 },
            new { Code = "AGR-VITICOL",   Ro = "Lucrari in vie",                 Ru = "Работы в винограднике",          En = "Vineyard work",               Order = 13 },
            new { Code = "AGR-LIVADA",    Ro = "Lucrari in livada",              Ru = "Работы в саду",                  En = "Orchard work",                Order = 14 },
            new { Code = "AGR-GRADINA",   Ro = "Lucrari de gradinarit",          Ru = "Садовые работы",                 En = "Gardening",                   Order = 15 },
            new { Code = "AGR-ZOOTEH",    Ro = "Ingrijirea animalelor",          Ru = "Уход за животными",              En = "Animal care",                 Order = 16 },
            new { Code = "AGR-FAN",       Ro = "Coasa si recolta de fan",        Ru = "Косьба и заготовка сена",        En = "Mowing and haymaking",        Order = 17 },
            new { Code = "SILV-LEMN",     Ro = "Tairea / colectarea lemnului",   Ru = "Рубка / сбор древесины",         En = "Wood cutting / collection",   Order = 20 },
            new { Code = "INC-DESC",      Ro = "Incarcare si descarcare",        Ru = "Погрузка и разгрузка",           En = "Loading and unloading",       Order = 30 },
            new { Code = "CURATENIE",     Ro = "Curatenie",                      Ru = "Уборка",                         En = "Cleaning",                    Order = 31 },
            new { Code = "INTRETIN",      Ro = "Lucrari de intretinere",         Ru = "Работы по обслуживанию",         En = "Maintenance work",            Order = 32 },
        };

        var category = Constants.NomenclatorCategories.ActivityTypes;
        var existingCodes = await context.Nomenclators
            .Where(n => n.Category == category)
            .Select(n => n.Code)
            .ToListAsync();

        var toAdd = desired
            .Where(d => !existingCodes.Contains(d.Code))
            .Select(d => new Nomenclator
            {
                Category = category,
                Code = d.Code,
                TitleRo = d.Ro,
                TitleRu = d.Ru,
                TitleEn = d.En,
                SortOrder = d.Order,
                IsActive = true,
            })
            .ToList();

        if (toAdd.Count == 0) return;

        context.Nomenclators.AddRange(toAdd);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCaemActivityTypesAsync(DataContext context)
    {
        var desired = new[]
        {
            new { Code = "01.11", Ro = "Cultivarea cerealelor (exclusiv orez), plantelor leguminoase şi a plantelor producătoare de seminţe oleaginoase", Order = 100 },
            new { Code = "01.12", Ro = "Cultivarea orezului", Order = 101 },
            new { Code = "01.13", Ro = "Cultivarea legumelor şi a pepenilor, a rădăcinoaselor şi tuberculilor", Order = 102 },
            new { Code = "01.14", Ro = "Cultivarea trestiei de zahăr", Order = 103 },
            new { Code = "01.15", Ro = "Cultivarea tutunului", Order = 104 },
            new { Code = "01.16", Ro = "Cultivarea plantelor pentru fibre textile", Order = 105 },
            new { Code = "01.19", Ro = "Cultivarea altor plante din culturi nepermanente", Order = 106 },
            new { Code = "01.21", Ro = "Cultivarea strugurilor", Order = 107 },
            new { Code = "01.22", Ro = "Cultivarea fructelor tropicale şi subtropicale", Order = 108 },
            new { Code = "01.23", Ro = "Cultivarea fructelor citrice", Order = 109 },
            new { Code = "01.24", Ro = "Cultivarea fructelor seminţoase şi sâmburoase", Order = 110 },
            new { Code = "01.25", Ro = "Cultivarea arbuştilor fructiferi, căpşunilor, nuciferilor şi a altor pomi fructiferi", Order = 111 },
            new { Code = "01.26", Ro = "Cultivarea fructelor oleaginoase", Order = 112 },
            new { Code = "01.27", Ro = "Cultivarea plantelor pentru prepararea băuturilor", Order = 113 },
            new { Code = "01.28", Ro = "Cultivarea condimentelor, plantelor aromatice, medicinale şi a plantelor de uz farmaceutic", Order = 114 },
            new { Code = "01.29", Ro = "Cultivarea altor plante din culturi permanente", Order = 115 },
            new { Code = "01.30", Ro = "Cultivarea plantelor pentru înmulţire", Order = 116 },
            new { Code = "01.41", Ro = "Creşterea bovinelor de lapte", Order = 117 },
            new { Code = "01.42", Ro = "Creşterea altor bovine", Order = 118 },
            new { Code = "01.43", Ro = "Creşterea cailor şi a altor cabaline", Order = 119 },
            new { Code = "01.44", Ro = "Creşterea cămilelor şi a camelidelor", Order = 120 },
            new { Code = "01.45", Ro = "Creşterea ovinelor şi caprinelor", Order = 121 },
            new { Code = "01.46", Ro = "Creşterea porcinelor", Order = 122 },
            new { Code = "01.47", Ro = "Creşterea păsărilor", Order = 123 },
            new { Code = "01.49", Ro = "Creşterea altor specii de animale", Order = 124 },
            new { Code = "01.50", Ro = "Activităţi în ferme mixte (cultura vegetală combinată cu creşterea animalelor)", Order = 125 },
            new { Code = "01.61", Ro = "Activităţi auxiliare pentru producţia vegetală", Order = 126 },
            new { Code = "01.62", Ro = "Activităţi auxiliare pentru creşterea animalelor", Order = 127 },
            new { Code = "01.63", Ro = "Activităţi după recoltare", Order = 128 },
            new { Code = "01.64", Ro = "Pregătirea seminţelor în vederea însămînţării", Order = 129 },
            new { Code = "01.70", Ro = "Vânătoare, capturarea cu capcane a vânatului şi activităţi de servicii anexe vânătorii", Order = 130 },
            new { Code = "02.10", Ro = "Silvicultură şi alte activităţi forestiere", Order = 131 },
            new { Code = "02.20", Ro = "Exploatarea forestieră", Order = 132 },
            new { Code = "02.30", Ro = "Colectarea produselor forestiere nelemnoase din flora spontană", Order = 133 },
            new { Code = "02.40", Ro = "Activităţi de servicii anexe silviculturii", Order = 134 },
            new { Code = "03.11", Ro = "Pescuitul maritim", Order = 135 },
            new { Code = "03.12", Ro = "Pescuitul în ape dulci", Order = 136 },
            new { Code = "03.21", Ro = "Acvacultura  maritimă", Order = 137 },
            new { Code = "03.22", Ro = "Acvacultura în ape dulci", Order = 138 },
            new { Code = "05.10", Ro = "Extracţia cărbunelui superior (PCS=>23865 kJ/kg)", Order = 139 },
            new { Code = "05.20", Ro = "Extracţia cărbunelui inferior (PCS<23865 kJ/kg)", Order = 140 },
            new { Code = "06.10", Ro = "Extracţia petrolului brut", Order = 141 },
            new { Code = "06.20", Ro = "Extracţia gazelor naturale", Order = 142 },
            new { Code = "07.10", Ro = "Extracţia minereurilor feroase", Order = 143 },
            new { Code = "07.21", Ro = "Extracţia minereurilor de uraniu şi toriu", Order = 144 },
            new { Code = "07.29", Ro = "Extracţia altor minereuri metalifere neferoase", Order = 145 },
            new { Code = "08.11", Ro = "Extracţia pietrei ornamentale şi a pietrei pentru construcţii; extracţia pietrei calcaroase, ghipsului, cretei şi a ardeziei", Order = 146 },
            new { Code = "08.12", Ro = "Extracţia pietrişului şi nisipului; extracţia argilei şi caolinului", Order = 147 },
            new { Code = "08.91", Ro = "Extracţia mineralelor pentru industria chimică şi a îngrăşămintelor naturale", Order = 148 },
            new { Code = "08.92", Ro = "Extracţia şi aglomerarea turbei", Order = 149 },
            new { Code = "08.93", Ro = "Extracţia sării", Order = 150 },
            new { Code = "08.99", Ro = "Alte activităţi extractive n.c.a.", Order = 151 },
            new { Code = "09.10", Ro = "Activităţi de servicii anexe extracţiei petrolului brut şi gazelor naturale", Order = 152 },
            new { Code = "09.90", Ro = "Activităţi de servicii anexe pentru extracţia altor minerale", Order = 153 },
            new { Code = "10.11", Ro = "Producţia, prelucrarea şi conservarea cărnii", Order = 154 },
            new { Code = "10.12", Ro = "Prelucrarea şi conservarea cărnii de pasăre", Order = 155 },
            new { Code = "10.13", Ro = "Fabricarea produselor din carne (inclusiv din carne de pasăre)", Order = 156 },
            new { Code = "10.20", Ro = "Prelucrarea şi conservarea peştelui, crustaceelor şi moluştelor", Order = 157 },
            new { Code = "10.31", Ro = "Prelucrarea şi conservarea cartofilor", Order = 158 },
            new { Code = "10.32", Ro = "Fabricarea sucurilor de fructe şi legume", Order = 159 },
            new { Code = "10.39", Ro = "Prelucrarea şi conservarea fructelor şi legumelor, cu excepţia cartofilor", Order = 160 },
            new { Code = "10.41", Ro = "Fabricarea uleiurilor şi grăsimilor", Order = 161 },
            new { Code = "10.42", Ro = "Fabricarea margarinei şi a altor produse comestibile similare", Order = 162 },
            new { Code = "10.51", Ro = "Fabricarea produselor lactate şi a brânzeturilor", Order = 163 },
            new { Code = "10.52", Ro = "Fabricarea îngheţatei", Order = 164 },
            new { Code = "10.61", Ro = "Fabricarea produselor de morărit", Order = 165 },
            new { Code = "10.62", Ro = "Fabricarea amidonului şi a produselor din amidon", Order = 166 },
            new { Code = "10.71", Ro = "Fabricarea pâinii; fabricarea prăjiturilor şi a produselor proaspete de patiserie", Order = 167 },
            new { Code = "10.72", Ro = "Fabricarea biscuiţilor şi pişcoturilor; fabricarea prăjiturilor şi a  produselor conservate de patiserie", Order = 168 },
            new { Code = "10.73", Ro = "Fabricarea macaroanelor, tăiţeilor, cuş-cuş-ului şi a altor produse făinoase similare", Order = 169 },
            new { Code = "10.81", Ro = "Fabricarea zahărului", Order = 170 },
            new { Code = "10.82", Ro = "Fabricarea produselor din cacao, a ciocolatei  şi a produselor zaharoase", Order = 171 },
            new { Code = "10.83", Ro = "Prelucrarea ceaiului şi cafelei", Order = 172 },
            new { Code = "10.84", Ro = "Fabricarea condimentelor şi ingredientelor", Order = 173 },
            new { Code = "10.85", Ro = "Fabricarea de mâncăruri preparate", Order = 174 },
            new { Code = "10.86", Ro = "Fabricarea preparatelor alimentare omogenizate şi alimentelor dietetice", Order = 175 },
            new { Code = "10.89", Ro = "Fabricarea altor produse alimentare n.c.a.", Order = 176 },
            new { Code = "10.91", Ro = "Fabricarea preparatelor pentru hrana animalelor de fermă", Order = 177 },
            new { Code = "10.92", Ro = "Fabricarea preparatelor pentru hrana animalelor de companie", Order = 178 },
            new { Code = "11.01", Ro = "Distilarea, rafinarea şi mixarea băuturilor alcoolice", Order = 179 },
            new { Code = "11.02", Ro = "Fabricarea vinurilor din struguri", Order = 180 },
            new { Code = "11.03", Ro = "Fabricarea cidrului şi a altor vinuri din fructe", Order = 181 },
            new { Code = "11.04", Ro = "Fabricarea altor băuturi nedistilate, obţinute prin fermentare", Order = 182 },
            new { Code = "11.05", Ro = "Fabricarea berii", Order = 183 },
            new { Code = "11.06", Ro = "Fabricarea malţului", Order = 184 },
            new { Code = "11.07", Ro = "Producţia de băuturi răcoritoare nealcoolice; producţia de ape minerale şi alte ape îmbuteliate", Order = 185 },
            new { Code = "12.00", Ro = "Fabricarea produselor din tutun", Order = 186 },
            new { Code = "13.10", Ro = "Pregătirea fibrelor şi filarea fibrelor textile", Order = 187 },
            new { Code = "13.20", Ro = "Producţia de ţesături", Order = 188 },
            new { Code = "13.30", Ro = "Finisarea materialelor textile", Order = 189 },
            new { Code = "13.91", Ro = "Fabricarea de metraje prin tricotare sau croşetare", Order = 190 },
            new { Code = "13.92", Ro = "Fabricarea de articole confecţionate din textile (cu excepţia îmbrăcămintei şi lenjeriei de corp)", Order = 191 },
            new { Code = "13.93", Ro = "Fabricarea de covoare şi mochete", Order = 192 },
            new { Code = "13.94", Ro = "Fabricarea de odgoane, frânghii, sfori şi plase", Order = 193 },
            new { Code = "13.95", Ro = "Fabricarea de textile neţesute şi articole din acestea, cu excepţia confecţiilor de îmbrăcăminte", Order = 194 },
            new { Code = "13.96", Ro = "Fabricarea altor articole tehnice şi industriale din textile", Order = 195 },
            new { Code = "13.99", Ro = "Fabricarea altor articole textile n.c.a.", Order = 196 },
            new { Code = "14.11", Ro = "Fabricarea articolelor de îmbrăcăminte din piele", Order = 197 },
            new { Code = "14.12", Ro = "Fabricarea articolelor de îmbrăcăminte pentru lucru", Order = 198 },
            new { Code = "14.13", Ro = "Fabricarea altor articole de îmbrăcăminte (exclusiv lenjeria de corp)", Order = 199 },
            new { Code = "14.14", Ro = "Fabricarea de articole de lenjerie de corp", Order = 200 },
            new { Code = "14.19", Ro = "Fabricarea altor articole de îmbrăcăminte şi accesorii n.c.a.", Order = 201 },
            new { Code = "14.20", Ro = "Fabricarea articolelor din blană", Order = 202 },
            new { Code = "14.31", Ro = "Fabricarea prin tricotare sau croşetare a ciorapilor şi articolelor de galanterie", Order = 203 },
            new { Code = "14.39", Ro = "Fabricarea prin tricotare sau croşetare a altor articole de îmbrăcăminte", Order = 204 },
            new { Code = "15.11", Ro = "Tăbăcirea şi finisarea pieilor; prepararea şi vopsirea blănurilor", Order = 205 },
            new { Code = "15.12", Ro = "Fabricarea articolelor de voiaj şi marochinărie, a articolelor de harnaşament şi a altor articole din piele", Order = 206 },
            new { Code = "15.20", Ro = "Fabricarea încălţămintei", Order = 207 },
            new { Code = "16.10", Ro = "Tăierea şi rindeluirea lemnului", Order = 208 },
            new { Code = "16.21", Ro = "Fabricarea de furnire şi a panourilor din lemn", Order = 209 },
            new { Code = "16.22", Ro = "Fabricarea parchetului asamblat în panouri", Order = 210 },
            new { Code = "16.23", Ro = "Fabricarea altor elemente de dulgherie şi tâmplărie, pentru construcţii", Order = 211 },
            new { Code = "16.24", Ro = "Fabricarea ambalajelor din lemn", Order = 212 },
            new { Code = "16.29", Ro = "Fabricarea altor produse din lemn; fabricarea articolelor din plută, paie şi din alte materiale vegetale împletite", Order = 213 },
            new { Code = "17.11", Ro = "Fabricarea celulozei", Order = 214 },
            new { Code = "17.12", Ro = "Fabricarea hârtiei şi cartonului", Order = 215 },
            new { Code = "17.21", Ro = "Fabricarea hârtiei şi cartonului ondulat şi a ambalajelor din hârtie şi carton", Order = 216 },
            new { Code = "17.22", Ro = "Fabricarea produselor de uz gospodăresc şi sanitar, din hârtie sau carton", Order = 217 },
            new { Code = "17.23", Ro = "Fabricarea articolelor de papetărie", Order = 218 },
            new { Code = "17.24", Ro = "Fabricarea tapetului", Order = 219 },
            new { Code = "17.29", Ro = "Fabricarea altor articole din hârtie şi carton n.c.a.", Order = 220 },
            new { Code = "18.11", Ro = "Tipărirea ziarelor", Order = 221 },
            new { Code = "18.12", Ro = "Alte activităţi de tipărire n.c.a.", Order = 222 },
            new { Code = "18.13", Ro = "Servicii pregătitoare pentru tipărire", Order = 223 },
            new { Code = "18.14", Ro = "Legătorie şi servicii conexe", Order = 224 },
            new { Code = "18.20", Ro = "Reproducerea înregistrărilor", Order = 225 },
            new { Code = "19.10", Ro = "Fabricarea produselor de cocserie", Order = 226 },
            new { Code = "19.20", Ro = "Fabricarea produselor obţinute din prelucrarea ţiţeiului", Order = 227 },
            new { Code = "20.11", Ro = "Fabricarea gazelor industriale", Order = 228 },
            new { Code = "20.12", Ro = "Fabricarea coloranţilor şi a pigmenţilor", Order = 229 },
            new { Code = "20.13", Ro = "Fabricarea altor produse chimice anorganice, de bază", Order = 230 },
            new { Code = "20.14", Ro = "Fabricarea altor produse chimice organice, de bază", Order = 231 },
            new { Code = "20.15", Ro = "Fabricarea îngrăşămintelor şi produselor azotoase", Order = 232 },
            new { Code = "20.16", Ro = "Fabricarea materialelor plastice în forme primare", Order = 233 },
            new { Code = "20.17", Ro = "Fabricarea cauciucului sintetic în forme primare", Order = 234 },
            new { Code = "20.20", Ro = "Fabricarea pesticidelor şi a altor produse agrochimice", Order = 235 },
            new { Code = "20.30", Ro = "Fabricarea vopselelor, lacurilor, cernelii tipografice şi masticurilor", Order = 236 },
            new { Code = "20.41", Ro = "Fabricarea săpunurilor, detergenţilor şi a produselor de întreţinere", Order = 237 },
            new { Code = "20.42", Ro = "Fabricarea parfumurilor şi a produselor cosmetice (de toaletă)", Order = 238 },
            new { Code = "20.51", Ro = "Fabricarea explozivilor", Order = 239 },
            new { Code = "20.52", Ro = "Fabricarea cleiurilor", Order = 240 },
            new { Code = "20.53", Ro = "Fabricarea uleiurilor esenţiale", Order = 241 },
            new { Code = "20.59", Ro = "Fabricarea altor produse chimice n.c.a.", Order = 242 },
            new { Code = "20.60", Ro = "Fabricarea fibrelor sintetice şi artificiale", Order = 243 },
            new { Code = "21.10", Ro = "Fabricarea produselor farmaceutice de bază", Order = 244 },
            new { Code = "21.20", Ro = "Fabricarea preparatelor farmaceutice", Order = 245 },
            new { Code = "22.11", Ro = "Fabricarea anvelopelor şi a camerelor de aer; reşaparea şi refacerea anvelopelor", Order = 246 },
            new { Code = "22.19", Ro = "Fabricarea altor produse din cauciuc", Order = 247 },
            new { Code = "22.21", Ro = "Fabricarea plăcilor, foliilor, tuburilor şi profilelor din material plastic", Order = 248 },
            new { Code = "22.22", Ro = "Fabricarea articolelor de ambalaj din material plastic", Order = 249 },
            new { Code = "22.23", Ro = "Fabricarea articolelor din material plastic pentru construcţii", Order = 250 },
            new { Code = "22.29", Ro = "Fabricarea altor produse din material plastic", Order = 251 },
            new { Code = "23.11", Ro = "Fabricarea sticlei plate", Order = 252 },
            new { Code = "23.12", Ro = "Prelucrarea şi fasonarea sticlei plate", Order = 253 },
            new { Code = "23.13", Ro = "Fabricarea articolelor din sticlă", Order = 254 },
            new { Code = "23.14", Ro = "Fabricarea fibrelor din sticlă", Order = 255 },
            new { Code = "23.19", Ro = "Fabricarea de sticlărie tehnică", Order = 256 },
            new { Code = "23.20", Ro = "Fabricarea de produse refractare", Order = 257 },
            new { Code = "23.31", Ro = "Fabricarea plăcilor şi dalelor din ceramică", Order = 258 },
            new { Code = "23.32", Ro = "Fabricarea cărămizilor, ţiglelor şi altor produse pentru construcţii, din argilă arsă", Order = 259 },
            new { Code = "23.41", Ro = "Fabricarea articolelor ceramice pentru uz gospodăresc şi ornamental", Order = 260 },
            new { Code = "23.42", Ro = "Fabricarea de obiecte sanitare din ceramică", Order = 261 },
            new { Code = "23.43", Ro = "Fabricarea izolatorilor şi pieselor izolante din ceramică", Order = 262 },
            new { Code = "23.44", Ro = "Fabricarea altor produse tehnice din ceramică", Order = 263 },
            new { Code = "23.49", Ro = "Fabricarea altor produse ceramice n.c.a.", Order = 264 },
            new { Code = "23.51", Ro = "Fabricarea cimentului", Order = 265 },
            new { Code = "23.52", Ro = "Fabricarea varului şi ipsosului", Order = 266 },
            new { Code = "23.61", Ro = "Fabricarea produselor din beton pentru construcţii", Order = 267 },
            new { Code = "23.62", Ro = "Fabricarea produselor din ipsos pentru construcţii", Order = 268 },
            new { Code = "23.63", Ro = "Fabricarea betonului", Order = 269 },
            new { Code = "23.64", Ro = "Fabricarea mortarului", Order = 270 },
            new { Code = "23.65", Ro = "Fabricarea produselor din azbociment", Order = 271 },
            new { Code = "23.69", Ro = "Fabricarea altor articole din beton, ciment şi ipsos", Order = 272 },
            new { Code = "23.70", Ro = "Tăierea, fasonarea şi finisarea pietrei", Order = 273 },
            new { Code = "23.91", Ro = "Fabricarea de produse abrazive", Order = 274 },
            new { Code = "23.99", Ro = "Fabricarea altor produse din minerale nemetalice, n.c.a.", Order = 275 },
            new { Code = "24.10", Ro = "Producţia de metale feroase sub forme primare şi de feroaliaje", Order = 276 },
            new { Code = "24.20", Ro = "Producţia de tuburi, ţevi, profile tubulare şi accesorii pentru acestea, din oţel", Order = 277 },
            new { Code = "24.31", Ro = "Tragere la rece a barelor", Order = 278 },
            new { Code = "24.32", Ro = "Laminare la rece a benzilor înguste", Order = 279 },
            new { Code = "24.33", Ro = "Producţia de profile obţinute la rece prin ştanţare sau fălţuire", Order = 280 },
            new { Code = "24.34", Ro = "Trefilarea firelor la rece", Order = 281 },
            new { Code = "24.41", Ro = "Producţia metalelor preţioase", Order = 282 },
            new { Code = "24.42", Ro = "Producţia aluminiului", Order = 283 },
            new { Code = "24.43", Ro = "Producţia plumbului, zincului şi cositorului", Order = 284 },
            new { Code = "24.44", Ro = "Producţia cuprului", Order = 285 },
            new { Code = "24.45", Ro = "Producţia altor metale neferoase", Order = 286 },
            new { Code = "24.46", Ro = "Prelucrarea combustibililor nucleari", Order = 287 },
            new { Code = "24.51", Ro = "Turnarea fontei", Order = 288 },
            new { Code = "24.52", Ro = "Turnarea oţelului", Order = 289 },
            new { Code = "24.53", Ro = "Turnarea metalelor neferoase uşoare", Order = 290 },
            new { Code = "24.54", Ro = "Turnarea altor metale neferoase", Order = 291 },
            new { Code = "25.11", Ro = "Fabricarea de construcţii metalice şi părţi componente ale structurilor metalice", Order = 292 },
            new { Code = "25.12", Ro = "Fabricarea de uşi şi ferestre din metal", Order = 293 },
            new { Code = "25.21", Ro = "Producţia de radiatoare şi cazane pentru încălzire centrală", Order = 294 },
            new { Code = "25.29", Ro = "Producţia de rezervoare, cisterne şi containere metalice", Order = 295 },
            new { Code = "25.30", Ro = "Producţia generatoarelor de aburi (cu excepţia cazanelor pentru încălzire centrală)", Order = 296 },
            new { Code = "25.40", Ro = "Fabricarea armamentului şi muniţiei", Order = 297 },
            new { Code = "25.50", Ro = "Fabricarea produselor metalice obţinute prin forjare, presare, ştanţare şi laminare; metalurgia pulberilor", Order = 298 },
            new { Code = "25.61", Ro = "Tratarea şi acoperirea metalelor", Order = 299 },
            new { Code = "25.62", Ro = "Operaţiuni de mecanică generală", Order = 300 },
            new { Code = "25.71", Ro = "Fabricarea produselor de tăiat", Order = 301 },
            new { Code = "25.72", Ro = "Fabricarea articolelor de feronerie (lacăte şi balamale)", Order = 302 },
            new { Code = "25.73", Ro = "Fabricarea uneltelor", Order = 303 },
            new { Code = "25.91", Ro = "Fabricarea de recipiente, containere şi alte produse similare din oţel", Order = 304 },
            new { Code = "25.92", Ro = "Fabricarea ambalajelor din metale uşoare", Order = 305 },
            new { Code = "25.93", Ro = "Fabricarea articolelor din fire metalice; fabricarea de lanţuri şi arcuri", Order = 306 },
            new { Code = "25.94", Ro = "Fabricarea de şuruburi, buloane şi alte articole filetate; fabricarea de nituri şi şaibe", Order = 307 },
            new { Code = "25.99", Ro = "Fabricarea altor articole din metal n.c.a.", Order = 308 },
            new { Code = "26.11", Ro = "Fabricarea componentelor electronice (module)", Order = 309 },
            new { Code = "26.12", Ro = "Fabricarea altor componente electronice", Order = 310 },
            new { Code = "26.20", Ro = "Fabricarea calculatoarelor şi a echipamentelor periferice", Order = 311 },
            new { Code = "26.30", Ro = "Fabricarea echipamentelor de comunicaţii", Order = 312 },
            new { Code = "26.40", Ro = "Fabricarea produselor electronice de larg consum", Order = 313 },
            new { Code = "26.51", Ro = "Fabricarea de instrumente şi dispozitive pentru măsură, verificare, control, navigaţie", Order = 314 },
            new { Code = "26.52", Ro = "Producţia de ceasuri", Order = 315 },
            new { Code = "26.60", Ro = "Fabricarea de echipamente pentru radiologie, electrodiagnostic şi electroterapie", Order = 316 },
            new { Code = "26.70", Ro = "Fabricarea de instrumente optice şi echipamente fotografice", Order = 317 },
            new { Code = "26.80", Ro = "Fabricarea suporţilor magnetici şi optici destinaţi înregistrărilor", Order = 318 },
            new { Code = "27.11", Ro = "Fabricarea motoarelor, generatoarelor şi transformatoarelor electrice", Order = 319 },
            new { Code = "27.12", Ro = "Fabricarea aparatelor de distribuţie şi control a electricităţii", Order = 320 },
            new { Code = "27.20", Ro = "Fabricarea de acumulatori şi baterii", Order = 321 },
            new { Code = "27.31", Ro = "Fabricarea de cabluri cu fibră optică", Order = 322 },
            new { Code = "27.32", Ro = "Fabricarea altor fire şi cabluri electrice şi electronice", Order = 323 },
            new { Code = "27.33", Ro = "Fabricarea dispozitivelor de conexiune pentru fire şi cabluri electrice şi electronice", Order = 324 },
            new { Code = "27.40", Ro = "Fabricarea de echipamente electrice de iluminat", Order = 325 },
            new { Code = "27.51", Ro = "Fabricarea de aparate electrocasnice", Order = 326 },
            new { Code = "27.52", Ro = "Fabricarea de echipamente casnice neelectrice", Order = 327 },
            new { Code = "27.90", Ro = "Fabricarea altor echipamente electrice", Order = 328 },
            new { Code = "28.11", Ro = "Fabricarea de motoare şi turbine (cu excepţia celor pentru avioane, autovehicule şi motociclete)", Order = 329 },
            new { Code = "28.12", Ro = "Fabricarea de echipamente hidraulice", Order = 330 },
            new { Code = "28.13", Ro = "Fabricarea de alte pompe şi compresoare", Order = 331 },
            new { Code = "28.14", Ro = "Fabricarea de alte robinete şi valve", Order = 332 },
            new { Code = "28.15", Ro = "Fabricarea lagărelor, angrenajelor, cutiilor de viteză şi a elementelor mecanice de transmisie", Order = 333 },
            new { Code = "28.21", Ro = "Fabricarea cuptoarelor, furnalelor şi arzătoarelor", Order = 334 },
            new { Code = "28.22", Ro = "Fabricarea echipamentelor de ridicat şi manipulat", Order = 335 },
            new { Code = "28.23", Ro = "Fabricarea maşinilor şi echipamentelor de birou (exclusiv fabricarea calculatoarelor şi a echipamentelor periferice)", Order = 336 },
            new { Code = "28.24", Ro = "Fabricarea maşinilor-unelte portabile acţionate mecanic", Order = 337 },
            new { Code = "28.25", Ro = "Fabricarea echipamentelor de ventilaţie şi frigorifice, exclusiv a echipamentelor de uz casnic", Order = 338 },
            new { Code = "28.29", Ro = "Fabricarea altor maşini şi utilaje de utilizare generală n.c.a.", Order = 339 },
            new { Code = "28.30", Ro = "Fabricarea maşinilor şi utilajelor pentru agricultură şi exploatări forestiere", Order = 340 },
            new { Code = "28.41", Ro = "Fabricarea utilajelor şi a maşinilor-unelte pentru prelucrarea metalelor", Order = 341 },
            new { Code = "28.49", Ro = "Fabricarea altor maşini-unelte n.c.a.", Order = 342 },
            new { Code = "28.91", Ro = "Fabricarea utilajelor pentru metalurgie", Order = 343 },
            new { Code = "28.92", Ro = "Fabricarea utilajelor pentru extracţie şi construcţii", Order = 344 },
            new { Code = "28.93", Ro = "Fabricarea utilajelor pentru prelucrarea produselor alimentare, băuturilor şi tutunului", Order = 345 },
            new { Code = "28.94", Ro = "Fabricarea utilajelor pentru industria textilă, a îmbrăcămintei şi a pielăriei", Order = 346 },
            new { Code = "28.95", Ro = "Fabricarea utilajelor pentru industria hârtiei şi cartonului", Order = 347 },
            new { Code = "28.96", Ro = "Fabricarea utilajelor pentru prelucrarea maselor plastice şi a cauciucului", Order = 348 },
            new { Code = "28.99", Ro = "Fabricarea altor maşini şi utilaje specifice n.c.a.", Order = 349 },
            new { Code = "29.10", Ro = "Fabricarea autovehiculelor de transport rutier", Order = 350 },
            new { Code = "29.20", Ro = "Producţia de caroserii pentru autovehicule; fabricarea de  remorci şi semiremorci", Order = 351 },
            new { Code = "29.31", Ro = "Fabricarea de echipamente electrice şi electronice pentru autovehicule", Order = 352 },
            new { Code = "29.32", Ro = "Fabricarea altor piese şi accesorii pentru autovehicule", Order = 353 },
            new { Code = "30.11", Ro = "Construcţia de nave şi structuri plutitoare", Order = 354 },
            new { Code = "30.12", Ro = "Construcţia de ambarcaţiuni sportive şi de agrement", Order = 355 },
            new { Code = "30.20", Ro = "Fabricarea materialului rulant", Order = 356 },
            new { Code = "30.30", Ro = "Fabricarea de aeronave şi nave spaţiale", Order = 357 },
            new { Code = "30.40", Ro = "Fabricarea vehiculelor militare de luptă", Order = 358 },
            new { Code = "30.91", Ro = "Fabricarea de motociclete", Order = 359 },
            new { Code = "30.92", Ro = "Fabricarea de biciclete şi de vehicule pentru invalizi", Order = 360 },
            new { Code = "30.99", Ro = "Fabricarea altor mijloace de transport n.c.a.", Order = 361 },
            new { Code = "31.01", Ro = "Fabricarea de mobilă pentru birouri şi magazine", Order = 362 },
            new { Code = "31.02", Ro = "Fabricarea de mobilă pentru bucătării", Order = 363 },
            new { Code = "31.03", Ro = "Fabricarea de saltele", Order = 364 },
            new { Code = "31.09", Ro = "Fabricarea de mobilă n.c.a.", Order = 365 },
            new { Code = "32.11", Ro = "Baterea monedelor", Order = 366 },
            new { Code = "32.12", Ro = "Fabricarea bijuteriilor şi articolelor similare din metale şi pietre preţioase", Order = 367 },
            new { Code = "32.13", Ro = "Fabricarea imitaţiilor de bijuterii şi articole similare", Order = 368 },
            new { Code = "32.20", Ro = "Fabricarea instrumentelor muzicale", Order = 369 },
            new { Code = "32.30", Ro = "Fabricarea articolelor pentru sport", Order = 370 },
            new { Code = "32.40", Ro = "Fabricarea jocurilor şi jucăriilor", Order = 371 },
            new { Code = "32.50", Ro = "Fabricarea de dispozitive, aparate şi instrumente medicale stomatologice", Order = 372 },
            new { Code = "32.91", Ro = "Fabricarea măturilor şi periilor", Order = 373 },
            new { Code = "32.99", Ro = "Fabricarea altor produse manufacturiere n.c.a.", Order = 374 },
            new { Code = "33.11", Ro = "Repararea articolelor fabricate din metal", Order = 375 },
            new { Code = "33.12", Ro = "Repararea maşinilor", Order = 376 },
            new { Code = "33.13", Ro = "Repararea echipamentelor electronice şi optice", Order = 377 },
            new { Code = "33.14", Ro = "Repararea echipamentelor electrice", Order = 378 },
            new { Code = "33.15", Ro = "Repararea şi întreţinerea navelor şi bărcilor", Order = 379 },
            new { Code = "33.16", Ro = "Repararea şi întreţinerea aeronavelor şi navelor spaţiale", Order = 380 },
            new { Code = "33.17", Ro = "Repararea şi întreţinerea altor echipamente de transport", Order = 381 },
            new { Code = "33.19", Ro = "Repararea altor echipamente", Order = 382 },
            new { Code = "33.20", Ro = "Instalarea maşinilor şi echipamentelor industriale", Order = 383 },
            new { Code = "35.11", Ro = "Producţia de energie electrică", Order = 384 },
            new { Code = "35.12", Ro = "Transportul energiei electrice", Order = 385 },
            new { Code = "35.13", Ro = "Distribuţia energiei electrice", Order = 386 },
            new { Code = "35.14", Ro = "Comercializarea energiei electrice", Order = 387 },
            new { Code = "35.21", Ro = "Producţia gazelor", Order = 388 },
            new { Code = "35.22", Ro = "Distribuţia combustibililor gazoşi prin conducte", Order = 389 },
            new { Code = "35.23", Ro = "Comercializarea combustibililor gazoşi, prin conducte", Order = 390 },
            new { Code = "35.30", Ro = "Furnizarea de abur şi aer condiţionat", Order = 391 },
            new { Code = "36.00", Ro = "Captarea, tratarea şi distribuţia apei", Order = 392 },
            new { Code = "37.00", Ro = "Colectarea şi epurarea apelor uzate", Order = 393 },
            new { Code = "38.11", Ro = "Colectarea deşeurilor nepericuloase", Order = 394 },
            new { Code = "38.12", Ro = "Colectarea deşeurilor periculoase", Order = 395 },
            new { Code = "38.21", Ro = "Tratarea şi eliminarea deşeurilor nepericuloase", Order = 396 },
            new { Code = "38.22", Ro = "Tratarea şi eliminarea deşeurilor periculoase", Order = 397 },
            new { Code = "38.31", Ro = "Demontarea (dezasamblarea) maşinilor şi a echipamentelor scoase din uz pentru recuperarea materialelor", Order = 398 },
            new { Code = "38.32", Ro = "Recuperarea materialelor reciclabile sortate", Order = 399 },
            new { Code = "39.00", Ro = "Activităţi şi servicii de decontaminare", Order = 400 },
            new { Code = "41.10", Ro = "Dezvoltare (promovare) imobiliară", Order = 401 },
            new { Code = "41.20", Ro = "Lucrări de construcţii a clădirilor rezidenţiale şi nerezidenţiale", Order = 402 },
            new { Code = "42.11", Ro = "Lucrări de construcţii a drumurilor şi autostrăzilor", Order = 403 },
            new { Code = "42.12", Ro = "Lucrări de construcţii a căilor ferate de suprafaţă şi subterane", Order = 404 },
            new { Code = "42.13", Ro = "Construcţia de poduri şi tuneluri", Order = 405 },
            new { Code = "42.21", Ro = "Lucrări de construcţii a proiectelor utilitare pentru fluide", Order = 406 },
            new { Code = "42.22", Ro = "Lucrări de construcţii a proiectelor utilitare pentru electricitate şi telecomunicaţii", Order = 407 },
            new { Code = "42.91", Ro = "Construcţii hidrotehnice", Order = 408 },
            new { Code = "42.99", Ro = "Lucrări de construcţii a altor proiecte inginereşti n.c.a.", Order = 409 },
            new { Code = "43.11", Ro = "Lucrări de demolare a construcţiilor", Order = 410 },
            new { Code = "43.12", Ro = "Lucrări de pregătire a terenului de construcţii", Order = 411 },
            new { Code = "43.13", Ro = "Lucrări de foraj şi sondaj pentru construcţii", Order = 412 },
            new { Code = "43.21", Ro = "Lucrări de instalaţii electrice", Order = 413 },
            new { Code = "43.22", Ro = "Lucrări de instalaţii tehnico-sanitare, de alimentare cu gaze, de încălzire şi de aer condiţionat", Order = 414 },
            new { Code = "43.29", Ro = "Alte lucrări de instalaţii pentru construcţii", Order = 415 },
            new { Code = "43.31", Ro = "Lucrări de tencuire", Order = 416 },
            new { Code = "43.32", Ro = "Lucrări de tâmplărie şi dulgherie", Order = 417 },
            new { Code = "43.33", Ro = "Lucrări de pardosire şi placare a pereţilor", Order = 418 },
            new { Code = "43.34", Ro = "Lucrări de vopsitorie, zugrăveli şi  montări de geamuri", Order = 419 },
            new { Code = "43.39", Ro = "Alte lucrări de finisare", Order = 420 },
            new { Code = "43.91", Ro = "Lucrări de învelitori, şarpante şi terase la construcţii", Order = 421 },
            new { Code = "43.99", Ro = "Alte lucrări speciale de construcţii n.c.a.", Order = 422 },
            new { Code = "45.11", Ro = "Comerţ cu  autoturisme şi autovehicule uşoare (sub 3,5 tone)", Order = 423 },
            new { Code = "45.19", Ro = "Comerţ cu alte autovehicule", Order = 424 },
            new { Code = "45.20", Ro = "Întreţinerea şi repararea autovehiculelor", Order = 425 },
            new { Code = "45.31", Ro = "Comerţ cu ridicata de piese şi accesorii pentru autovehicule", Order = 426 },
            new { Code = "45.32", Ro = "Comerţ cu amănuntul de piese şi accesorii pentru autovehicule", Order = 427 },
            new { Code = "45.40", Ro = "Comerţ cu motociclete, piese şi accesorii aferente; întreţinerea şi repararea motocicletelor", Order = 428 },
            new { Code = "46.11", Ro = "Intermedieri în comerţul cu materii prime agricole, animale vii, materii prime textile şi cu semifabricate", Order = 429 },
            new { Code = "46.12", Ro = "Intermedieri în comerţul cu combustibili, minereuri, metale şi produse chimice pentru industrie", Order = 430 },
            new { Code = "46.13", Ro = "Intermedieri în comerţul cu material lemnos şi materiale de construcţii", Order = 431 },
            new { Code = "46.14", Ro = "Intermedieri în comerţul cu maşini, echipamente industriale, nave şi avioane", Order = 432 },
            new { Code = "46.15", Ro = "Intermedieri în comerţul cu mobilă, articole de menaj şi de fierărie", Order = 433 },
            new { Code = "46.16", Ro = "Intermedieri în comerţul cu textile, confecţii din blană, încălţăminte şi articole din piele", Order = 434 },
            new { Code = "46.17", Ro = "Intermedieri în comerţul cu produse alimentare, inclusiv băuturi, şi tutun", Order = 435 },
            new { Code = "46.18", Ro = "Intermedieri în comerţul specializat în vânzarea produselor cu caracter specific, n.c.a.", Order = 436 },
            new { Code = "46.19", Ro = "Intermedieri în comerţul cu produse diverse", Order = 437 },
            new { Code = "46.21", Ro = "Comerţ cu ridicata al cerealelor, seminţelor, furajelor şi tutunului neprelucrat", Order = 438 },
            new { Code = "46.22", Ro = "Comerţ cu ridicata al florilor şi al plantelor", Order = 439 },
            new { Code = "46.23", Ro = "Comerţ cu  ridicata al animalelor vii", Order = 440 },
            new { Code = "46.24", Ro = "Comerţ cu ridicata al blănurilor, pieilor brute şi al pieilor prelucrate", Order = 441 },
            new { Code = "46.31", Ro = "Comerţ cu ridicata al fructelor şi legumelor", Order = 442 },
            new { Code = "46.32", Ro = "Comerţ cu ridicata al cărnii şi produselor din carne", Order = 443 },
            new { Code = "46.33", Ro = "Comerţ cu ridicata al produselor lactate, ouălor, uleiurilor şi grăsimilor comestibile", Order = 444 },
            new { Code = "46.34", Ro = "Comerţ cu ridicata al băuturilor", Order = 445 },
            new { Code = "46.35", Ro = "Comerţ cu ridicata al produselor din tutun", Order = 446 },
            new { Code = "46.36", Ro = "Comerţ cu ridicata al zahărului, ciocolatei şi produselor zaharoase", Order = 447 },
            new { Code = "46.37", Ro = "Comerţ cu ridicata cu cafea, ceai, cacao şi condimente", Order = 448 },
            new { Code = "46.38", Ro = "Comerţ cu ridicata specializat al altor alimente, inclusiv peşte, crustacee şi moluşte", Order = 449 },
            new { Code = "46.39", Ro = "Comerţ cu ridicata nespecializat de produse alimentare, băuturi şi tutun", Order = 450 },
            new { Code = "46.41", Ro = "Comerţ cu ridicata al produselor textile", Order = 451 },
            new { Code = "46.42", Ro = "Comerţ cu ridicata al îmbrăcămintei şi încălţămintei", Order = 452 },
            new { Code = "46.43", Ro = "Comerţ cu ridicata al aparatelor electrice de uz gospodăresc, al aparatelor de radio şi televizoarelor", Order = 453 },
            new { Code = "46.44", Ro = "Comerţ cu ridicata al produselor din ceramică, sticlărie şi al produselor de întreţinere", Order = 454 },
            new { Code = "46.45", Ro = "Comerţ cu ridicata al produselor cosmetice şi de parfumerie", Order = 455 },
            new { Code = "46.46", Ro = "Comerţ cu ridicata al produselor farmaceutice", Order = 456 },
            new { Code = "46.47", Ro = "Comerţ cu ridicata al mobilei, covoarelor şi a articolelor de iluminat", Order = 457 },
            new { Code = "46.48", Ro = "Comerţ cu ridicata al ceasurilor şi bijuteriilor", Order = 458 },
            new { Code = "46.49", Ro = "Comerţ cu ridicata al altor bunuri de uz gospodăresc", Order = 459 },
            new { Code = "46.51", Ro = "Comerţ cu ridicata al calculatoarelor, echipamentelor periferice şi software-lui", Order = 460 },
            new { Code = "46.52", Ro = "Comerţ cu ridicata de componente şi echipamente electronice şi de telecomunicaţii", Order = 461 },
            new { Code = "46.61", Ro = "Comerţ cu ridicata al maşinilor agricole, echipamentelor şi furniturilor", Order = 462 },
            new { Code = "46.62", Ro = "Comerţ cu ridicata al maşinilor-unelte", Order = 463 },
            new { Code = "46.63", Ro = "Comerţ cu ridicata al maşinilor pentru industria minieră şi construcţii", Order = 464 },
            new { Code = "46.64", Ro = "Comerţ cu ridicata al maşinilor pentru industria textilă şi al maşinilor de cusut şi de tricotat", Order = 465 },
            new { Code = "46.65", Ro = "Comerţ cu ridicata al mobilei de birou", Order = 466 },
            new { Code = "46.66", Ro = "Comerţ cu ridicata al altor maşini şi echipamente de birou", Order = 467 },
            new { Code = "46.69", Ro = "Comerţ cu ridicata al altor maşini şi echipamente", Order = 468 },
            new { Code = "46.71", Ro = "Comerţ cu ridicata al combustibililor solizi, lichizi şi gazoşi şi al produselor derivate", Order = 469 },
            new { Code = "46.72", Ro = "Comerţ cu ridicata al metalelor şi minereurilor metalice", Order = 470 },
            new { Code = "46.73", Ro = "Comerţ cu ridicata al materialului lemnos şi al materialelor de construcţie şi echipamentelor sanitare", Order = 471 },
            new { Code = "46.74", Ro = "Comerţ cu ridicata al echipamentelor şi furniturilor de fierărie pentru instalaţii sanitare şi de încălzire", Order = 472 },
            new { Code = "46.75", Ro = "Comerţ cu ridicata al produselor chimice", Order = 473 },
            new { Code = "46.76", Ro = "Comerţ cu ridicata al altor produse intermediare", Order = 474 },
            new { Code = "46.77", Ro = "Comerţ cu ridicata al deşeurilor şi resturilor", Order = 475 },
            new { Code = "46.90", Ro = "Comerţ cu ridicata nespecializat", Order = 476 },
            new { Code = "47.11", Ro = "Comerţ cu amănuntul în magazine nespecializate, cu vânzare predominantă de produse alimentare, băuturi şi tutun", Order = 477 },
            new { Code = "47.19", Ro = "Comerţ cu amănuntul în magazine nespecializate, cu vânzare predominantă de produse nealimentare", Order = 478 },
            new { Code = "47.21", Ro = "Comerţ cu amănuntul al fructelor şi legumelor proaspete, în magazine specializate", Order = 479 },
            new { Code = "47.22", Ro = "Comerţ cu amănuntul al cărnii şi al produselor din carne, în magazine specializate", Order = 480 },
            new { Code = "47.23", Ro = "Comerţ cu amănuntul al peştelui, crustaceelor şi moluştelor, în magazine specializate", Order = 481 },
            new { Code = "47.24", Ro = "Comerţ cu amănuntul al pâinii, produselor de patiserie şi produselor zaharoase, în magazine specializate", Order = 482 },
            new { Code = "47.25", Ro = "Comerţ cu amănuntul al băuturilor, în magazine specializate", Order = 483 },
            new { Code = "47.26", Ro = "Comerţ cu amănuntul al produselor din tutun, în magazine specializate", Order = 484 },
            new { Code = "47.29", Ro = "Comerţ cu amănuntul al altor produse alimentare, în magazine specializate", Order = 485 },
            new { Code = "47.30", Ro = "Comerţ cu amănuntul al carburanţilor pentru autovehicule în magazine specializate", Order = 486 },
            new { Code = "47.41", Ro = "Comerţ cu amănuntul al calculatoarelor, unităţilor periferice şi software-lui în magazine specializate", Order = 487 },
            new { Code = "47.42", Ro = "Comerţ cu amănuntul al echipamentului pentru  telecomunicaţii în magazine specializate", Order = 488 },
            new { Code = "47.43", Ro = "Comerţ cu amănuntul al echipamentelor audio/video în magazine specializate", Order = 489 },
            new { Code = "47.51", Ro = "Comerţ cu amănuntul al textilelor, în magazine specializate", Order = 490 },
            new { Code = "47.52", Ro = "Comerţ cu amănuntul al articolelor de fierărie, al articolelor din sticlă şi a celor pentru vopsit, în magazine specializate", Order = 491 },
            new { Code = "47.53", Ro = "Comerţ cu amănuntul al covoarelor, carpetelor, tapetelor şi a altor acoperitoare de podea, în magazine specializate", Order = 492 },
            new { Code = "47.54", Ro = "Comerţ cu amănuntul al articolelor şi aparatelor electrocasnice, în magazine specializate", Order = 493 },
            new { Code = "47.59", Ro = "Comerţ cu amănuntul al mobilei, al articolelor de iluminat şi al articolelor de uz casnic n.c.a., în magazine specializate", Order = 494 },
            new { Code = "47.61", Ro = "Comerţ cu amănuntul al cărţilor, în magazine specializate", Order = 495 },
            new { Code = "47.62", Ro = "Comerţ cu amănuntul al ziarelor şi articolelor de papetărie, în magazine specializate", Order = 496 },
            new { Code = "47.63", Ro = "Comerţ cu amănuntul al înregistrărilor muzicale şi video, în magazine specializate", Order = 497 },
            new { Code = "47.64", Ro = "Comerţ cu amănuntul al echipamentelor sportive, în magazine specializate", Order = 498 },
            new { Code = "47.65", Ro = "Comerţ cu amănuntul al jocurilor şi jucăriilor, în magazine specializate", Order = 499 },
            new { Code = "47.71", Ro = "Comerţ cu amănuntul al îmbrăcămintei, în magazine specializate", Order = 500 },
            new { Code = "47.72", Ro = "Comerţ cu amănuntul al încălţămintei şi articolelor din piele, în magazine specializate", Order = 501 },
            new { Code = "47.73", Ro = "Comerţ cu amănuntul al produselor farmaceutice, în magazine specializate", Order = 502 },
            new { Code = "47.74", Ro = "Comerţ cu amănuntul al articolelor medicale şi ortopedice, în magazine specializate", Order = 503 },
            new { Code = "47.75", Ro = "Comerţ cu amănuntul al produselor cosmetice şi de parfumerie, în magazine specializate", Order = 504 },
            new { Code = "47.76", Ro = "Comerţ cu amănuntul al florilor, plantelor şi seminţelor; comerţ cu amănuntul al animalelor de companie şi a hranei pentru acestea, în magazine specializate", Order = 505 },
            new { Code = "47.77", Ro = "Comerţ cu amănuntul al ceasurilor şi bijuteriilor, în magazine specializate", Order = 506 },
            new { Code = "47.78", Ro = "Comerţ cu amănuntul al altor bunuri noi, în magazine specializate", Order = 507 },
            new { Code = "47.79", Ro = "Comerţ cu amănuntul al bunurilor de ocazie vândute prin magazine", Order = 508 },
            new { Code = "47.81", Ro = "Comerţ cu amănuntul al produselor alimentare, băuturilor şi produselor din tutun efectuat prin standuri, chioşcuri şi pieţe", Order = 509 },
            new { Code = "47.82", Ro = "Comerţ cu amănuntul al textilelor, îmbrăcămintei şi încălţămintei efectuat prin standuri, chioşcuri şi pieţe", Order = 510 },
            new { Code = "47.89", Ro = "Comerţ cu amănuntul prin standuri, chioşcuri şi pieţe al altor produse", Order = 511 },
            new { Code = "47.91", Ro = "Comerţ cu amănuntul prin intermediul caselor de comenzi sau prin Internet", Order = 512 },
            new { Code = "47.99", Ro = "Comerţ cu amănuntul efectuat în afara magazinelor, standurilor, chioşcurilor şi pieţelor", Order = 513 },
            new { Code = "49.10", Ro = "Transporturi interurbane de călători pe calea ferată", Order = 514 },
            new { Code = "49.20", Ro = "Transporturi de marfă pe calea ferată", Order = 515 },
            new { Code = "49.31", Ro = "Transporturi urbane terestre şi suburbane de călători", Order = 516 },
            new { Code = "49.32", Ro = "Transporturi cu taxiuri", Order = 517 },
            new { Code = "49.39", Ro = "Alte transporturi terestre de călători n.c.a.", Order = 518 },
            new { Code = "49.41", Ro = "Transporturi rutiere de mărfuri", Order = 519 },
            new { Code = "49.42", Ro = "Servicii de mutare", Order = 520 },
            new { Code = "49.50", Ro = "Transporturi prin conducte", Order = 521 },
            new { Code = "50.10", Ro = "Transporturi maritime şi costiere de pasageri", Order = 522 },
            new { Code = "50.20", Ro = "Transporturi maritime şi costiere de marfă", Order = 523 },
            new { Code = "50.30", Ro = "Transportul de pasageri pe căi navigabile interioare", Order = 524 },
            new { Code = "50.40", Ro = "Transportul de marfă pe căi navigabile interioare", Order = 525 },
            new { Code = "51.10", Ro = "Transporturi aeriene de pasageri", Order = 526 },
            new { Code = "51.21", Ro = "Transporturi aeriene de marfă", Order = 527 },
            new { Code = "51.22", Ro = "Transporturi spaţiale", Order = 528 },
            new { Code = "52.10", Ro = "Depozitări", Order = 529 },
            new { Code = "52.21", Ro = "Activităţi de servicii anexe pentru transporturi terestre", Order = 530 },
            new { Code = "52.22", Ro = "Activităţi de servicii anexe transporturilor pe apă", Order = 531 },
            new { Code = "52.23", Ro = "Activităţi de servicii anexe transporturilor aeriene", Order = 532 },
            new { Code = "52.24", Ro = "Manipulări", Order = 533 },
            new { Code = "52.29", Ro = "Alte activităţi anexe transporturilor", Order = 534 },
            new { Code = "53.10", Ro = "Activităţi poştale desfăşurate sub obligativitatea serviciului universal", Order = 535 },
            new { Code = "53.20", Ro = "Alte activităţi poştale şi de curier", Order = 536 },
            new { Code = "55.10", Ro = "Hoteluri şi alte facilităţi de cazare similare", Order = 537 },
            new { Code = "55.20", Ro = "Facilităţi de cazare pentru vacanţe şi perioade de scurtă durată", Order = 538 },
            new { Code = "55.30", Ro = "Parcuri pentru rulote, campinguri şi  tabere", Order = 539 },
            new { Code = "55.90", Ro = "Alte servicii de cazare", Order = 540 },
            new { Code = "56.10", Ro = "Restaurante", Order = 541 },
            new { Code = "56.21", Ro = "Activităţi de alimentaţie (catering) pentru evenimente", Order = 542 },
            new { Code = "56.29", Ro = "Alte activităţi de alimentaţie", Order = 543 },
            new { Code = "56.30", Ro = "Baruri şi alte activităţi de servire a băuturilor", Order = 544 },
            new { Code = "58.11", Ro = "Activităţi de editare a cărţilor", Order = 545 },
            new { Code = "58.12", Ro = "Activităţi de editare de ghiduri, liste de adrese şi similare", Order = 546 },
            new { Code = "58.13", Ro = "Activităţi de editare a ziarelor", Order = 547 },
            new { Code = "58.14", Ro = "Activităţi de editare a revistelor şi periodicelor", Order = 548 },
            new { Code = "58.19", Ro = "Alte activităţi de editare", Order = 549 },
            new { Code = "58.21", Ro = "Activităţi de editare a jocurilor de calculator", Order = 550 },
            new { Code = "58.29", Ro = "Activităţi de editare a altor produse software", Order = 551 },
            new { Code = "59.11", Ro = "Activităţi de producţie cinematografică, video şi de programe de televiziune", Order = 552 },
            new { Code = "59.12", Ro = "Activităţi de post-producţie cinematografică, video şi de programe de televiziune", Order = 553 },
            new { Code = "59.13", Ro = "Activităţi de distribuţie a filmelor cinematografice, video şi a programelor de televiziune", Order = 554 },
            new { Code = "59.14", Ro = "Proiecţia de filme cinematografice", Order = 555 },
            new { Code = "59.20", Ro = "Activităţi de realizare a înregistrărilor audio şi activităţi de editare muzicală", Order = 556 },
            new { Code = "60.10", Ro = "Activităţi de difuzare a programelor de radio", Order = 557 },
            new { Code = "60.20", Ro = "Activităţi de producere şi difuzare a programelor de televiziune", Order = 558 },
            new { Code = "61.10", Ro = "Activităţi de comunicaţii electronice prin reţele cu cablu", Order = 559 },
            new { Code = "61.20", Ro = "Activităţi de comunicaţii electronice prin reţele fără cablu (exclusiv prin satelit)", Order = 560 },
            new { Code = "61.30", Ro = "Activităţi de comunicaţii electronice prin satelit", Order = 561 },
            new { Code = "61.90", Ro = "Alte activităţi de comunicaţii electronice", Order = 562 },
            new { Code = "62.01", Ro = "Activităţi de realizare a soft-ului la comandă (software orientat client)", Order = 563 },
            new { Code = "62.02", Ro = "Activităţi de consultanţă în tehnologia informaţiei", Order = 564 },
            new { Code = "62.03", Ro = "Activităţi de management (gestiune şi exploatare) a mijloacelor de calcul", Order = 565 },
            new { Code = "62.09", Ro = "Alte activităţi de servicii privind tehnologia informaţiei", Order = 566 },
            new { Code = "63.11", Ro = "Prelucrarea datelor, administrarea paginilor web şi activităţi conexe", Order = 567 },
            new { Code = "63.12", Ro = "Activităţi ale portalurilor web", Order = 568 },
            new { Code = "63.91", Ro = "Activităţi ale agenţiilor de ştiri", Order = 569 },
            new { Code = "63.99", Ro = "Alte activităţi de servicii informaţionale n.c.a", Order = 570 },
            new { Code = "64.11", Ro = "Activităţi ale Băncii Naţionale (centrale)", Order = 571 },
            new { Code = "64.19", Ro = "Alte activităţi de intermedieri monetare", Order = 572 },
            new { Code = "64.20", Ro = "Activităţi ale holdingurilor", Order = 573 },
            new { Code = "64.30", Ro = "Fonduri mutuale şi alte entităţi financiare similare", Order = 574 },
            new { Code = "64.91", Ro = "Leasing financiar", Order = 575 },
            new { Code = "64.92", Ro = "Alte activităţi de creditare", Order = 576 },
            new { Code = "64.99", Ro = "Alte intermedieri financiare n.c.a.", Order = 577 },
            new { Code = "65.11", Ro = "Activităţi de asigurări de viaţă", Order = 578 },
            new { Code = "65.12", Ro = "Alte activităţi de asigurări (exceptând asigurările de viaţă)", Order = 579 },
            new { Code = "65.20", Ro = "Activităţi de reasigurare", Order = 580 },
            new { Code = "65.30", Ro = "Activităţi ale fondurilor de pensii, cu excepţia celor din sistemul public de asigurări sociale", Order = 581 },
            new { Code = "66.11", Ro = "Administrarea pieţelor financiare", Order = 582 },
            new { Code = "66.12", Ro = "Activităţi de intermediere (brokeraj) a tranzacţiilor financiare", Order = 583 },
            new { Code = "66.19", Ro = "Activităţi auxiliare intermedierilor financiare, exclusiv activităţi de asigurări şi fonduri de pensii", Order = 584 },
            new { Code = "66.21", Ro = "Activităţi de evaluare a riscului de asigurare şi a pagubelor", Order = 585 },
            new { Code = "66.22", Ro = "Activităţi ale agenţilor şi broker-ilor de asigurări", Order = 586 },
            new { Code = "66.29", Ro = "Alte activităţi auxiliare de asigurări şi fonduri de pensii", Order = 587 },
            new { Code = "66.30", Ro = "Activităţi de administrare a fondurilor", Order = 588 },
            new { Code = "68.10", Ro = "Cumpărarea şi vânzarea de bunuri imobiliare proprii", Order = 589 },
            new { Code = "68.20", Ro = "Închirierea şi exploatarea bunurilor imobiliare proprii sau închiriate", Order = 590 },
            new { Code = "68.31", Ro = "Activităţi ale agenţiilor imobiliare", Order = 591 },
            new { Code = "68.32", Ro = "Administrarea imobilelor pe bază de tarife sau contract", Order = 592 },
            new { Code = "69.10", Ro = "Activităţi juridice", Order = 593 },
            new { Code = "69.20", Ro = "Activităţi de contabilitate şi audit financiar; consultanţă în domeniul fiscal", Order = 594 },
            new { Code = "70.10", Ro = "Activităţi ale direcţiilor administrative centralizate", Order = 595 },
            new { Code = "70.21", Ro = "Activităţi de consultanţă în domeniul relaţiilor publice şi al comunicării", Order = 596 },
            new { Code = "70.22", Ro = "Activităţi de consultanţă pentru afaceri şi management", Order = 597 },
            new { Code = "71.11", Ro = "Activităţi de arhitectură", Order = 598 },
            new { Code = "71.12", Ro = "Activităţi de inginerie şi consultanţă tehnică legate de acestea", Order = 599 },
            new { Code = "71.20", Ro = "Activităţi de testare şi analize tehnice", Order = 600 },
            new { Code = "72.11", Ro = "Cercetare-dezvoltare în biotehnologie", Order = 601 },
            new { Code = "72.19", Ro = "Cercetare-dezvoltare în alte ştiinţe naturale şi inginerie", Order = 602 },
            new { Code = "72.20", Ro = "Cercetare-dezvoltare în ştiinţe sociale şi umaniste", Order = 603 },
            new { Code = "73.11", Ro = "Activităţi ale agenţiilor de publicitate", Order = 604 },
            new { Code = "73.12", Ro = "Servicii de reprezentare media", Order = 605 },
            new { Code = "73.20", Ro = "Activităţi de studiere a pieţei şi de sondare a opiniei publice", Order = 606 },
            new { Code = "74.10", Ro = "Activităţi de design specializat", Order = 607 },
            new { Code = "74.20", Ro = "Activităţi fotografice", Order = 608 },
            new { Code = "74.30", Ro = "Activităţi de traducere scrisă şi orală (interpreţi)", Order = 609 },
            new { Code = "74.90", Ro = "Alte activităţi profesionale, ştiinţifice şi tehnice n.c.a.", Order = 610 },
            new { Code = "75.00", Ro = "Activităţi veterinare", Order = 611 },
            new { Code = "77.11", Ro = "Activităţi de închiriere şi leasing de autoturisme şi autovehicule rutiere uşoare", Order = 612 },
            new { Code = "77.12", Ro = "Activităţi de închiriere şi leasing de autovehicule rutiere grele", Order = 613 },
            new { Code = "77.21", Ro = "Activităţi de închiriere şi leasing de bunuri recreaţionale şi echipament sportiv", Order = 614 },
            new { Code = "77.22", Ro = "Închirierea de casete video şi discuri (CD-uri, DVD-uri)", Order = 615 },
            new { Code = "77.29", Ro = "Activităţi de închiriere şi leasing de alte bunuri personale şi gospodăreşti n.c.a.", Order = 616 },
            new { Code = "77.31", Ro = "Activităţi de închiriere şi leasing de maşini şi echipamente agricole", Order = 617 },
            new { Code = "77.32", Ro = "Activităţi de închiriere şi leasing de maşini şi echipamente pentru construcţii", Order = 618 },
            new { Code = "77.33", Ro = "Activităţi de închiriere şi leasing de maşini şi echipamente de birou (inclusiv calculatoare)", Order = 619 },
            new { Code = "77.34", Ro = "Activităţi de închiriere şi leasing de echipamente de transport pe apă", Order = 620 },
            new { Code = "77.35", Ro = "Activităţi de închiriere şi leasing de echipamente de transport aerian", Order = 621 },
            new { Code = "77.39", Ro = "Activităţi de închirierea şi leasing de alte maşini,  echipamente şi bunuri tangibile n.c.a.", Order = 622 },
            new { Code = "77.40", Ro = "Leasing de proprietăţi intelectuale şi producţie similară (exclusiv bunuri cu drept de autor)", Order = 623 },
            new { Code = "78.10", Ro = "Activităţi ale agenţiilor de plasare a forţei de muncă", Order = 624 },
            new { Code = "78.20", Ro = "Activităţi de contractare, pe baze temporare, a personalului", Order = 625 },
            new { Code = "78.30", Ro = "Alte servicii de furnizare a forţei de muncă", Order = 626 },
            new { Code = "79.11", Ro = "Activităţi ale agenţiilor turistice", Order = 627 },
            new { Code = "79.12", Ro = "Activităţi ale tur-operatorilor", Order = 628 },
            new { Code = "79.90", Ro = "Alte servicii de rezervare şi asistenţă turistică", Order = 629 },
            new { Code = "80.10", Ro = "Activităţi de securitate privată", Order = 630 },
            new { Code = "80.20", Ro = "Activităţi de servicii privind sistemele de securizare", Order = 631 },
            new { Code = "80.30", Ro = "Activităţi de investigaţii", Order = 632 },
            new { Code = "81.10", Ro = "Activităţi de servicii suport combinate", Order = 633 },
            new { Code = "81.21", Ro = "Activităţi generale (nespecializate) de curăţenie interioară a clădirilor", Order = 634 },
            new { Code = "81.22", Ro = "Activităţi specializate de curăţenie a clădirilor, mijloacelor de transport, maşinilor şi utilajelor", Order = 635 },
            new { Code = "81.29", Ro = "Alte activităţi de curăţenie n.c.a.", Order = 636 },
            new { Code = "81.30", Ro = "Activităţi de întreţinere peisagistică", Order = 637 },
            new { Code = "82.11", Ro = "Activităţi combinate de secretariat", Order = 638 },
            new { Code = "82.19", Ro = "Activităţi de fotocopiere, de pregătire a documentelor şi alte activităţi specializate de secretariat", Order = 639 },
            new { Code = "82.20", Ro = "Activităţi ale centrelor de intermediere telefonică (call center)", Order = 640 },
            new { Code = "82.30", Ro = "Activităţi de organizare a expoziţiilor, târgurilor şi congreselor", Order = 641 },
            new { Code = "82.91", Ro = "Activităţi ale agenţiilor de colectare a plăţilor şi a birourilor (oficiilor) de raportare a creditului", Order = 642 },
            new { Code = "82.92", Ro = "Activităţi de ambalare", Order = 643 },
            new { Code = "82.99", Ro = "Alte activităţi de servicii suport pentru întreprinderi n.c.a.", Order = 644 },
            new { Code = "84.11", Ro = "Servicii de administraţie publică generală", Order = 645 },
            new { Code = "84.12", Ro = "Reglementarea activităţilor organismelor care prestează servicii în domeniul îngrijirii sănătăţii, învăţământului, culturii şi al altor activităţi sociale, exclusiv protecţia socială", Order = 646 },
            new { Code = "84.13", Ro = "Reglementarea şi eficientizarea activităţilor economice", Order = 647 },
            new { Code = "84.21", Ro = "Activităţi de afaceri externe", Order = 648 },
            new { Code = "84.22", Ro = "Activităţi de apărare naţională", Order = 649 },
            new { Code = "84.23", Ro = "Activităţi de justiţie", Order = 650 },
            new { Code = "84.24", Ro = "Activităţi de ordine publică şi de protecţie civilă", Order = 651 },
            new { Code = "84.25", Ro = "Activităţi de protecție în cazuri excepționale", Order = 652 },
            new { Code = "84.30", Ro = "Activităţi de protecţie socială obligatorie", Order = 653 },
            new { Code = "85.10", Ro = "Învăţământ preşcolar", Order = 654 },
            new { Code = "85.20", Ro = "Învăţământ primar", Order = 655 },
            new { Code = "85.31", Ro = "Învăţământ secundar general", Order = 656 },
            new { Code = "85.32", Ro = "Învăţământ secundar, tehnic sau profesional", Order = 657 },
            new { Code = "85.41", Ro = "Învăţământ superior non-universitar", Order = 658 },
            new { Code = "85.42", Ro = "Învăţământ superior universitar", Order = 659 },
            new { Code = "85.51", Ro = "Învăţământ în domeniul sportiv şi recreaţional", Order = 660 },
            new { Code = "85.52", Ro = "Învăţământ artistic (muzică, teatru, coreografie, arte plastice şi altele)", Order = 661 },
            new { Code = "85.53", Ro = "Şcoli de conducere (pilotaj)", Order = 662 },
            new { Code = "85.59", Ro = "Alte forme de învăţământ n.c.a.", Order = 663 },
            new { Code = "85.60", Ro = "Activităţi de servicii suport pentru învăţământ", Order = 664 },
            new { Code = "86.10", Ro = "Activităţi de asistenţă spitalicească", Order = 665 },
            new { Code = "86.21", Ro = "Activităţi de asistenţă medicală generală", Order = 666 },
            new { Code = "86.22", Ro = "Activităţi de asistenţă medicală specializată", Order = 667 },
            new { Code = "86.23", Ro = "Activităţi de asistenţă stomatologică", Order = 668 },
            new { Code = "86.90", Ro = "Alte activităţi referitoare la sănătatea umană", Order = 669 },
            new { Code = "87.10", Ro = "Activităţi ale centrelor de îngrijire medicală", Order = 670 },
            new { Code = "87.20", Ro = "Activităţi ale centrelor de recuperare psihică şi de dezintoxicare, exclusiv spitale", Order = 671 },
            new { Code = "87.30", Ro = "Activităţi ale căminelor de bătrâni şi ale căminelor pentru persoane aflate în incapacitate de a se îngriji singure", Order = 672 },
            new { Code = "87.90", Ro = "Alte activităţi de asistenţă socială, cu cazare n.c.a.", Order = 673 },
            new { Code = "88.10", Ro = "Activităţi de asistenţă socială, fără cazare, pentru bătrâni şi pentru persoane cu dizabilităţi", Order = 674 },
            new { Code = "88.91", Ro = "Activităţi de îngrijire zilnică pentru copii", Order = 675 },
            new { Code = "88.99", Ro = "Alte activităţi de asistenţă socială, fără cazare, n.c.a.", Order = 676 },
            new { Code = "90.01", Ro = "Activităţi de interpretare artistică (spectacole)", Order = 677 },
            new { Code = "90.02", Ro = "Activităţi suport pentru interpretarea artistică (spectacole)", Order = 678 },
            new { Code = "90.03", Ro = "Activităţi de creaţie artistică", Order = 679 },
            new { Code = "90.04", Ro = "Activităţi de gestionare a sălilor de spectacole", Order = 680 },
            new { Code = "91.01", Ro = "Activităţi ale bibliotecilor şi arhivelor", Order = 681 },
            new { Code = "91.02", Ro = "Activităţi ale muzeelor", Order = 682 },
            new { Code = "91.03", Ro = "Gestionarea monumentelor, clădirilor istorice şi a altor obiective de interes turistic", Order = 683 },
            new { Code = "91.04", Ro = "Activităţi ale grădinilor zoologice, botanice şi ale rezervaţiilor naturale", Order = 684 },
            new { Code = "92.00", Ro = "Activităţi de jocuri de noroc şi pariuri", Order = 685 },
            new { Code = "93.11", Ro = "Activităţi ale bazelor sportive", Order = 686 },
            new { Code = "93.12", Ro = "Activităţi ale cluburilor sportive", Order = 687 },
            new { Code = "93.13", Ro = "Activităţi ale centrelor de fitness", Order = 688 },
            new { Code = "93.19", Ro = "Alte activităţi sportive", Order = 689 },
            new { Code = "93.21", Ro = "Parcuri tematice (bâlciuri) şi parcuri de distracţii", Order = 690 },
            new { Code = "93.29", Ro = "Alte activităţi recreative şi distractive n.c.a.", Order = 691 },
            new { Code = "94.11", Ro = "Activităţi ale organizaţiilor economice şi patronale", Order = 692 },
            new { Code = "94.12", Ro = "Activităţi ale organizaţiilor profesionale", Order = 693 },
            new { Code = "94.20", Ro = "Activităţi ale sindicatelor salariaţilor", Order = 694 },
            new { Code = "94.91", Ro = "Activităţi ale organizaţiilor religioase", Order = 695 },
            new { Code = "94.92", Ro = "Activităţi ale organizaţiilor politice", Order = 696 },
            new { Code = "94.99", Ro = "Activităţi ale altor organizaţii n.c.a.", Order = 697 },
            new { Code = "95.11", Ro = "Repararea calculatoarelor şi a echipamentelor periferice", Order = 698 },
            new { Code = "95.12", Ro = "Repararea echipamentelor de comunicaţii", Order = 699 },
            new { Code = "95.21", Ro = "Repararea aparatelor electronice de uz casnic", Order = 700 },
            new { Code = "95.22", Ro = "Repararea dispozitivelor de uz gospodăresc şi a echipamentelor pentru casă şi grădină", Order = 701 },
            new { Code = "95.23", Ro = "Repararea încălţămintei şi a articolelor din piele", Order = 702 },
            new { Code = "95.24", Ro = "Repararea mobilei şi a furniturilor casnice", Order = 703 },
            new { Code = "95.25", Ro = "Repararea ceasurilor şi a bijuteriilor", Order = 704 },
            new { Code = "95.29", Ro = "Repararea articolelor de uz personal şi gospodăresc n.c.a.", Order = 705 },
            new { Code = "96.01", Ro = "Spălarea şi curăţarea (uscată) articolelor textile şi a produselor din  blană", Order = 706 },
            new { Code = "96.02", Ro = "Coafură şi alte activităţi de înfrumuseţare", Order = 707 },
            new { Code = "96.03", Ro = "Activităţi de pompe funebre şi similare", Order = 708 },
            new { Code = "96.04", Ro = "Activităţi de întreţinere corporală", Order = 709 },
            new { Code = "96.09", Ro = "Alte activităţi de servicii personale n.c.a.", Order = 710 },
            new { Code = "97.00", Ro = "Activităţi ale gospodăriilor casnice în calitate de angajator de personal casnic", Order = 711 },
            new { Code = "98.10", Ro = "Activităţi ale gospodăriilor casnice de producere de bunuri destinate consumului propriu", Order = 712 },
            new { Code = "98.20", Ro = "Activităţi ale gospodăriilor casnice de producere de servicii pentru scopuri proprii", Order = 713 },
            new { Code = "99.00", Ro = "Activităţi ale organizaţiilor şi organismelor extrateritoriale", Order = 714 },
        };

        var category = Constants.NomenclatorCategories.ActivityTypes;
        var existingCodes = await context.Nomenclators
            .Where(n => n.Category == category)
            .Select(n => n.Code)
            .ToListAsync();

        var toAdd = desired
            .Where(d => !existingCodes.Contains(d.Code))
            .Select(d => new Nomenclator
            {
                Category = category,
                Code = d.Code,
                TitleRo = d.Ro,
                SortOrder = d.Order,
                IsActive = true,
            })
            .ToList();

        if (toAdd.Count == 0) return;

        context.Nomenclators.AddRange(toAdd);
        await context.SaveChangesAsync();
    }
}
