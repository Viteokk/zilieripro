import { ChangeDetectionStrategy, Component, computed, HostListener, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { StatusBadgeComponent } from '../../../shared/ui/components/status-badge.component';
import { VoucherStore } from '../data/voucher.store';
import { VoucherDataService } from '../data/voucher-data.service';
import { AuthStore } from '../../../shared/auth/auth.store';
import { PaginatedResult, VoucherStatus, VoucherTableItem } from '../../../shared/models/voucher.model';
import { MaskIdnpPipe } from '../../../shared/pipes/mask-idnp.pipe';

@Component({
  selector: 'app-voucher-list',
  standalone: true,
  imports: [FormsModule, RouterLink, StatusBadgeComponent, TranslatePipe, MaskIdnpPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto">
      <!-- Header: title + primary actions -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 class="text-3xl font-bold tracking-tight text-foreground">{{ 'voucher.list.title' | t }}</h1>
        @if (!isInspector()) {
        <div class="flex items-center gap-2">
          <button type="button" (click)="exportCsv()"
            class="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground"
            title="Exporta CSV">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {{ 'action.exportCsv' | t }}
          </button>
          <button type="button" (click)="openRegisterPicker()"
            class="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {{ 'voucher.list.registerBtn' | t }}
          </button>
          <a routerLink="/reports/ipc21"
            class="inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium shadow-xs transition-all hover:bg-accent hover:text-accent-foreground">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/>
            </svg>
            IPC 21
          </a>
          <a routerLink="/vouchers/create"
            class="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium shadow-xs transition-all hover:bg-primary/90">
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            {{ 'voucher.list.createBtn' | t }}
          </a>
        </div>
        }
      </div>

      <!-- Filters: single responsive row -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 mb-6">
        <!-- Search: takes remaining space -->
        <div class="relative lg:col-span-4">
          <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text"
            class="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            [placeholder]="'voucher.list.searchPlaceholder' | t"
            [ngModel]="store.state().workerIdnp"
            (ngModelChange)="onFilterChange('workerIdnp', $event)" />
        </div>

        <!-- Statut -->
        <select
          class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:col-span-2"
          [ngModel]="store.state().status"
          (ngModelChange)="onFilterChange('status', $event)">
          <option value="">{{ 'voucher.list.statusAll' | t }}</option>
          <option value="Emis">{{ 'status.emis' | t }}</option>
          <option value="Activ">{{ 'status.activ' | t }}</option>
          <option value="Executat">{{ 'status.executat' | t }}</option>
          <option value="Raportat">{{ 'status.raportat' | t }}</option>
          <option value="Anulat">{{ 'status.anulat' | t }}</option>
        </select>

        <!-- Raion -->
        <select
          class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:col-span-2"
          [ngModel]="store.state().district"
          (ngModelChange)="onFilterChange('district', $event)">
          <option value="">{{ 'voucher.list.districtAll' | t }}</option>
          <option value="Chisinau">Chisinau</option>
          <option value="Balti">Balti</option>
          <option value="Cahul">Cahul</option>
          <option value="Orhei">Orhei</option>
          <option value="Ungheni">Ungheni</option>
          <option value="Soroca">Soroca</option>
        </select>

        @if (isInspector()) {
        <!-- Locality multi-select dropdown with search (Inspector only).
             Flat list (toate localitatile), supports multi-select via CSV in store.locality. -->
        <div class="relative lg:col-span-2">
          <button type="button" (click)="toggleLocalityDropdown(); $event.stopPropagation()"
            class="h-9 w-full rounded-md border border-input bg-transparent pl-3 pr-8 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 text-left cursor-pointer">
            <span class="block truncate">
              @if (selectedLocalitiesList().length === 0) {
                Localitate: toate
              } @else if (selectedLocalitiesList().length === 1) {
                {{ selectedLocalitiesList()[0] }}
              } @else {
                {{ selectedLocalitiesList().length }} selectate
              }
            </span>
            <!-- chevron absolute, small — mimic native <select> arrow -->
            <svg class="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground/60 pointer-events-none" fill="currentColor" viewBox="0 0 12 12">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            </svg>
          </button>

          @if (localityDropdownOpen()) {
            <!-- backdrop to close on outside click -->
            <div class="fixed inset-0 z-[40]" (click)="closeLocalityDropdown()"></div>
            <!-- panel -->
            <div class="absolute left-0 right-0 top-full mt-1 z-[50] max-h-80 overflow-hidden flex flex-col rounded-md border border-foreground/10 bg-white shadow-lg"
                 (click)="$event.stopPropagation()">
              <!-- search -->
              <div class="p-2 border-b border-foreground/10">
                <div class="relative">
                  <svg class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input type="text" placeholder="Cauta"
                    [ngModel]="localitySearch()"
                    (ngModelChange)="localitySearch.set($event)"
                    class="w-full h-8 pl-8 pr-2 text-sm border border-input rounded outline-none focus-visible:border-ring" />
                </div>
              </div>
              <!-- list -->
              <div class="overflow-y-auto flex-1">
                @if (filteredLocalitiesList().length > 0) {
                  <label class="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer border-b border-foreground/5">
                    <input type="checkbox" [checked]="isAllLocalitiesSelected()" (change)="toggleAllLocalities()" />
                    <span class="text-sm font-medium">Selecteaza tot</span>
                  </label>
                  @for (loc of filteredLocalitiesList(); track loc) {
                    <label class="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer">
                      <input type="checkbox"
                        [checked]="selectedLocalitiesList().includes(loc)"
                        (change)="toggleLocality(loc)" />
                      <span class="text-sm">{{ loc }}</span>
                    </label>
                  }
                } @else {
                  <div class="px-3 py-4 text-sm text-muted-foreground text-center">Nicio localitate gasita</div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Date from with label, Inspector only — self-end aligns inputs to row baseline -->
        <div class="flex flex-col gap-1 lg:col-span-2 self-end">
          <label class="text-xs font-medium text-muted-foreground leading-none">De la</label>
          <input type="date"
            class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            [ngModel]="store.state().dateFrom"
            (ngModelChange)="onFilterChange('dateFrom', $event)" />
        </div>

        <!-- Date to with label, Inspector only -->
        <div class="flex flex-col gap-1 lg:col-span-2 self-end">
          <label class="text-xs font-medium text-muted-foreground leading-none">Pana la</label>
          <input type="date"
            class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            [ngModel]="store.state().dateTo"
            (ngModelChange)="onFilterChange('dateTo', $event)" />
        </div>
        } @else {
        <!-- Date from -->
        <input type="date"
          class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:col-span-2"
          placeholder="De la"
          [ngModel]="store.state().dateFrom"
          (ngModelChange)="onFilterChange('dateFrom', $event)" />

        <!-- Date to -->
        <input type="date"
          class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 lg:col-span-2"
          placeholder="Pana la"
          [ngModel]="store.state().dateTo"
          (ngModelChange)="onFilterChange('dateTo', $event)" />
        }
      </div>

      <!-- Bulk action bar -->
      @if (selected().size > 0) {
        <div class="mb-4 flex items-center gap-3 rounded-md bg-primary/10 ring-1 ring-primary/30 px-4 py-2 text-sm">
          <span class="font-medium text-foreground">{{ selected().size }} {{ 'voucher.list.bulkSelected' | t }}</span>
          <button type="button" (click)="bulkActivate()" [disabled]="bulkRunning()"
            class="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 text-xs font-medium hover:bg-primary/90 disabled:opacity-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5"><polyline points="20 6 9 17 4 12"/></svg>
            {{ 'voucher.list.bulkActivate' | t }}
          </button>
          <button type="button" (click)="bulkPrint()"
            class="inline-flex h-8 items-center gap-1.5 rounded-md border border-input bg-background px-3 text-xs font-medium hover:bg-accent hover:text-accent-foreground">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-3.5">
              <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
            </svg>
            Printeaza selectate
          </button>
          <button type="button" (click)="clearSelection()"
            class="ml-auto text-xs text-muted-foreground hover:text-foreground">{{ 'voucher.list.bulkClear' | t }}</button>
        </div>
      }

      <!-- Register date picker modal -->
      @if (registerPickerOpen()) {
        <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40" (click)="closeRegisterPicker()">
          <div class="bg-white rounded-xl shadow-2xl w-full max-w-md p-6" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold text-foreground mb-1">{{ 'register.title' | t }}</h3>
            <p class="text-sm text-muted-foreground mb-4">{{ 'register.subtitle' | t }}</p>
            <label class="block text-sm font-medium mb-2">{{ 'register.activityDate' | t }}</label>
            <input type="date" [value]="registerDate()" (input)="registerDate.set($any($event.target).value)"
              class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            <div class="mt-5 flex justify-end gap-2">
              <button type="button" (click)="closeRegisterPicker()"
                class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium">{{ 'action.cancel' | t }}</button>
              <button type="button" (click)="openRegister()" [disabled]="!registerDate()"
                class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                {{ 'register.generate' | t }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Table (no card wrapper, like eSocial) -->
      <div class="relative w-full overflow-x-auto">
        <table class="w-full caption-bottom text-sm">
          <thead class="[&_tr]:border-b [&_tr]:border-foreground/10 bg-background sticky top-0 z-10">
            <tr>
              <th class="h-10 px-4 align-middle w-10">
                <input type="checkbox" class="rounded border-input"
                  [checked]="allSelected()"
                  [indeterminate]="someSelected() && !allSelected()"
                  (change)="toggleSelectAll()" />
              </th>
              <th class="text-muted-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap text-xs uppercase tracking-wide">{{ 'field.code' | t }}</th>
              <th class="text-muted-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap text-xs uppercase tracking-wide">{{ 'field.worker' | t }}</th>
              <th class="text-muted-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap text-xs uppercase tracking-wide">{{ 'field.idnp' | t }}</th>
              <th class="text-muted-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap text-xs uppercase tracking-wide">{{ 'field.district' | t }}</th>
              <th class="text-muted-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap text-xs uppercase tracking-wide">{{ 'common.status' | t }}</th>
              <th class="text-muted-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap text-xs uppercase tracking-wide">{{ 'field.hours' | t }}</th>
              <th class="text-muted-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap text-xs uppercase tracking-wide">{{ 'field.remuneration' | t }}</th>
              <th class="text-muted-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap text-xs uppercase tracking-wide">{{ 'common.date' | t }}</th>
              <th class="text-muted-foreground h-10 px-4 text-start align-middle font-medium whitespace-nowrap w-10"></th>
            </tr>
          </thead>
          <tbody class="[&_tr:last-child]:border-0">
            @for (voucher of vouchers(); track voucher.id) {
              <tr [class]="'border-b border-foreground/5 transition-colors ' + (selected().has(voucher.id) ? 'bg-primary/5' : 'hover:bg-muted/30')">
                <td class="px-4 py-3 align-middle w-10">
                  <input type="checkbox" class="rounded border-input"
                    [checked]="selected().has(voucher.id)"
                    (change)="toggleSelect(voucher.id)" />
                </td>
                <td class="px-4 py-3 align-middle whitespace-nowrap">
                  <a [routerLink]="['/vouchers', voucher.id]" class="text-primary hover:underline underline-offset-4 font-medium text-sm">
                    {{ voucher.code }}
                  </a>
                </td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground">{{ voucher.workerFullName }}</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/60 font-mono text-xs">{{ voucher.workerIdnp | maskIdnp }}</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ voucher.workDistrict }}</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap">
                  <span class="inline-flex items-center gap-1.5 text-sm">
                    <span [class]="'inline-block size-2 rounded-full ' + statusDotColor(voucher.status)"></span>
                    {{ voucher.status }}
                  </span>
                </td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ voucher.hoursWorked }}h</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ voucher.netRemuneration }} {{ 'common.mdl' | t }}</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap text-foreground/80">{{ voucher.workDate }}</td>
                <td class="px-4 py-3 align-middle whitespace-nowrap">
                  <div class="relative">
                    <button
                      class="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                      (click)="toggleMenu(voucher.id, $event.currentTarget)"
                    >
                      <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    @if (openMenuId() === voucher.id && menuPosition(); as pos) {
                      <div class="fixed z-[100] min-w-[180px] rounded-md border border-foreground/10 bg-white p-1 text-foreground shadow-lg"
                        [style.top.px]="pos.top"
                        [style.left.px]="pos.left">
                        <a
                          [routerLink]="['/vouchers', voucher.id]"
                          class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                          (click)="closeMenu()"
                        >
                          <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          {{ "action.view" | t }}
                        </a>
                        @if (!isInspector()) {
                        <a
                          [routerLink]="['/vouchers', voucher.id]"
                          class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                          (click)="closeMenu()"
                        >
                          <svg class="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                            <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
                          </svg>
                          Print
                        </a>
                        }
                        @if (!isInspector()) {
                          @if (voucher.status === 'Emis') {
                            <button
                              class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                              (click)="activateVoucher(voucher); closeMenu()"
                            >
                              <svg class="h-4 w-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
                              {{ "action.activate" | t }}
                            </button>
                          }
                          @if (voucher.status === 'Activ') {
                            <button
                              class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                              (click)="executeVoucher(voucher); closeMenu()"
                            >
                              <svg class="h-4 w-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                              {{ "action.execute" | t }}
                            </button>
                          }
                          @if (voucher.status === 'Executat') {
                            <button
                              class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground transition-colors"
                              (click)="reportVoucher(voucher); closeMenu()"
                            >
                              <svg class="h-4 w-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                              {{ "action.report" | t }}
                            </button>
                          }
                          @if (voucher.status === 'Emis' || voucher.status === 'Activ') {
                            <button
                              class="relative flex w-full cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none select-none text-destructive hover:bg-destructive/10 transition-colors"
                              (click)="cancelVoucher(voucher); closeMenu()"
                            >
                              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                              {{ "action.cancel" | t }}
                            </button>
                          }
                        }
                      </div>
                    }
                  </div>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="10" class="px-4 py-8 text-center text-sm text-muted-foreground">
                  {{ "voucher.list.empty" | t }}
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Pagination (eSocial style) -->
      <div class="flex items-center justify-between py-4 border-t border-border mt-0">
        <div class="text-sm text-muted-foreground">
          Total: {{ totalCount() }}
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <select
              class="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none"
              [ngModel]="store.state().limit"
              (ngModelChange)="onPageSizeChange($event)"
            >
              <option [value]="10">10</option>
              <option [value]="20">20</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
          </div>
          <div class="text-sm text-foreground">
            Pagina {{ currentPage() }} din {{ totalPages() }}
          </div>
          <div class="flex items-center gap-1">
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              [disabled]="currentPage() <= 1"
              (click)="goToPage(1)"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
            </button>
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              [disabled]="currentPage() <= 1"
              (click)="prevPage()"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              [disabled]="currentPage() >= totalPages()"
              (click)="nextPage()"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
            </button>
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background text-sm transition-all hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
              [disabled]="currentPage() >= totalPages()"
              (click)="goToPage(totalPages())"
            >
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class VoucherListComponent implements OnInit {
  protected readonly store = inject(VoucherStore);
  private readonly voucherDataService = inject(VoucherDataService);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthStore);
  protected readonly isInspector = computed(() => this.auth.roleType() === 'Inspector');

  /** Localitati per raion - vizibile in filtrul Localitate (Inspector only). Cateva exemple per raion. */
  protected readonly localitiesByDistrict: Record<string, string[]> = {
    Chisinau: ['Chisinau', 'Durlesti', 'Codru', 'Cricova', 'Sangera', 'Ciorescu'],
    Balti: ['Balti', 'Sadovoe', 'Elizaveta'],
    Cahul: ['Cahul', 'Slobozia Mare', 'Vulcanesti'],
    Orhei: ['Orhei', 'Branesti', 'Peresecina', 'Pohrebeni'],
    Ungheni: ['Ungheni', 'Cornesti', 'Sculeni', 'Petresti'],
    Soroca: ['Soroca', 'Cosauti', 'Rublenita', 'Vasilcau'],
  };

  /** Toate localitatile (flat) - sortate alfabetic. Sursa unica de adevar pentru dropdown-ul multi-select. */
  protected readonly allLocalitiesList = computed(() => {
    return Object.values(this.localitiesByDistrict).flat().sort((a, b) => a.localeCompare(b));
  });

  /** Localitatile selectate (parsate din CSV-ul stocat in store.locality). */
  protected readonly selectedLocalitiesList = computed(() => {
    const v = this.store.state().locality;
    return v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
  });

  /** Search local in dropdown-ul multi-select (Inspector only). */
  protected readonly localitySearch = signal('');
  protected readonly localityDropdownOpen = signal(false);

  /** Localitatile filtrate dupa termenul de cautare. */
  protected readonly filteredLocalitiesList = computed(() => {
    const term = this.localitySearch().trim().toLowerCase();
    const all = this.allLocalitiesList();
    return term ? all.filter(l => l.toLowerCase().includes(term)) : all;
  });

  protected readonly isAllLocalitiesSelected = computed(() => {
    const all = this.filteredLocalitiesList();
    if (all.length === 0) return false;
    const selected = this.selectedLocalitiesList();
    return all.every(l => selected.includes(l));
  });

  protected toggleLocalityDropdown(): void {
    this.localityDropdownOpen.update(v => !v);
    if (!this.localityDropdownOpen()) {
      this.localitySearch.set('');
    }
  }

  protected closeLocalityDropdown(): void {
    this.localityDropdownOpen.set(false);
    this.localitySearch.set('');
  }

  protected toggleLocality(loc: string): void {
    const current = this.selectedLocalitiesList();
    const next = current.includes(loc)
      ? current.filter(l => l !== loc)
      : [...current, loc];
    this.applyLocalitiesFilter(next);
  }

  protected toggleAllLocalities(): void {
    const filtered = this.filteredLocalitiesList();
    const allSelected = this.isAllLocalitiesSelected();
    if (allSelected) {
      // remove the visible filtered ones from selection
      const next = this.selectedLocalitiesList().filter(l => !filtered.includes(l));
      this.applyLocalitiesFilter(next);
    } else {
      // add all visible filtered ones to selection (deduplicated)
      const merged = Array.from(new Set([...this.selectedLocalitiesList(), ...filtered]));
      this.applyLocalitiesFilter(merged);
    }
  }

  private applyLocalitiesFilter(localities: string[]): void {
    this.store.setQuery({ locality: localities.join(','), offset: 0 });
    this.loadVouchers();
  }

  protected readonly vouchers = signal<VoucherTableItem[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly loading = signal(false);
  protected readonly openMenuId = signal('');
  protected readonly menuPosition = signal<{ top: number; left: number } | null>(null);

  // Bulk selection
  protected readonly selected = signal<Set<string>>(new Set<string>());
  protected readonly bulkRunning = signal(false);

  protected readonly allSelected = computed(() => {
    const ids = this.vouchers().map((v) => v.id);
    const sel = this.selected();
    return ids.length > 0 && ids.every((id) => sel.has(id));
  });
  protected readonly someSelected = computed(() => this.selected().size > 0);

  protected toggleSelect(id: string): void {
    const next = new Set(this.selected());
    if (next.has(id)) next.delete(id); else next.add(id);
    this.selected.set(next);
  }

  protected toggleSelectAll(): void {
    if (this.allSelected()) {
      this.selected.set(new Set());
    } else {
      this.selected.set(new Set(this.vouchers().map((v) => v.id)));
    }
  }

  protected clearSelection(): void {
    this.selected.set(new Set());
  }

  protected bulkPrint(): void {
    const ids = [...this.selected()];
    if (ids.length === 0) return;
    this.router.navigate(['/vouchers/print'], { queryParams: { ids: ids.join(',') } });
  }

  protected bulkActivate(): void {
    const ids = [...this.selected()].filter((id) => {
      const v = this.vouchers().find((x) => x.id === id);
      return v && v.status === 'Emis';
    });
    if (ids.length === 0) return;
    this.bulkRunning.set(true);
    let pending = ids.length;
    ids.forEach((id) => {
      this.voucherDataService.activateVoucher(id).subscribe({
        next: () => {
          if (--pending === 0) {
            this.selected.set(new Set());
            this.bulkRunning.set(false);
            this.loadVouchers();
          }
        },
        error: () => {
          if (--pending === 0) {
            this.bulkRunning.set(false);
            this.loadVouchers();
          }
        },
      });
    });
  }

  protected exportCsv(): void {
    const rows = this.vouchers();
    const header = ['Cod', 'Lucrator', 'IDNP', 'Raion', 'Statut', 'Ore', 'Remunerare neta', 'Remunerare bruta', 'Data lucru'];
    const csv = [header.join(',')]
      .concat(rows.map((v) => [
        v.code,
        `"${(v.workerFullName || '').replace(/"/g, '""')}"`,
        v.workerIdnp ?? '',
        v.workDistrict,
        v.status,
        v.hoursWorked,
        v.netRemuneration,
        v.grossRemuneration,
        v.workDate,
      ].join(',')))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchere-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  protected readonly registerPickerOpen = signal(false);
  protected readonly registerDate = signal(new Date().toISOString().split('T')[0]);

  protected openRegisterPicker(): void {
    this.registerPickerOpen.set(true);
  }
  protected closeRegisterPicker(): void {
    this.registerPickerOpen.set(false);
  }
  protected openRegister(): void {
    const date = this.registerDate();
    this.registerPickerOpen.set(false);
    this.router.navigate(['/vouchers/register'], { queryParams: { date } });
  }

  protected readonly currentPage = computed(() => {
    const s = this.store.state();
    return Math.floor(s.offset / s.limit) + 1;
  });

  protected readonly totalPages = computed(() => {
    const s = this.store.state();
    return Math.max(1, Math.ceil(this.totalCount() / s.limit));
  });

  ngOnInit(): void {
    this.loadVouchers();
  }

  protected onFilterChange(key: string, value: string): void {
    this.store.setQuery({ [key]: value, offset: 0 });
    this.loadVouchers();
  }

  protected onPageSizeChange(size: number): void {
    this.store.setQuery({ limit: +size, offset: 0 });
    this.loadVouchers();
  }

  protected toggleMenu(id: string, trigger?: EventTarget | null): void {
    if (this.openMenuId() === id) {
      this.closeMenu();
      return;
    }
    if (!(trigger instanceof HTMLElement)) {
      this.openMenuId.set(id);
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const popoverWidth = 200;
    const popoverHeight = 220;
    const flipUp = window.innerHeight - rect.bottom < popoverHeight + 8;
    const top = flipUp ? rect.top - popoverHeight - 4 : rect.bottom + 4;
    const left = Math.max(8, rect.right - popoverWidth);
    this.menuPosition.set({ top, left });
    this.openMenuId.set(id);
  }

  protected closeMenu(): void {
    if (this.openMenuId() !== '') {
      this.openMenuId.set('');
      this.menuPosition.set(null);
    }
  }

  @HostListener('window:scroll')
  protected onWindowScroll(): void {
    this.closeMenu();
  }

  protected statusDotColor(status: string): string {
    switch (status) {
      case 'Emis': return 'bg-gray-400';
      case 'Activ': return 'bg-blue-500';
      case 'Executat': return 'bg-green-500';
      case 'Raportat': return 'bg-primary';
      case 'Anulat': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  }

  protected prevPage(): void {
    const state = this.store.state();
    this.store.setQuery({ offset: Math.max(0, state.offset - state.limit) });
    this.loadVouchers();
  }

  protected nextPage(): void {
    const state = this.store.state();
    this.store.setQuery({ offset: state.offset + state.limit });
    this.loadVouchers();
  }

  protected goToPage(page: number): void {
    const state = this.store.state();
    this.store.setQuery({ offset: (page - 1) * state.limit });
    this.loadVouchers();
  }

  protected activateVoucher(voucher: VoucherTableItem): void {
    this.voucherDataService.activateVoucher(voucher.id).subscribe(() => this.loadVouchers());
  }

  protected executeVoucher(voucher: VoucherTableItem): void {
    this.voucherDataService.executeVoucher(voucher.id).subscribe(() => this.loadVouchers());
  }

  protected reportVoucher(voucher: VoucherTableItem): void {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    this.voucherDataService.reportVoucher(voucher.id, period).subscribe(() => this.loadVouchers());
  }

  protected cancelVoucher(voucher: VoucherTableItem): void {
    this.voucherDataService
      .cancelVoucher(voucher.id, {
        reasonCode: 'CA01',
        cancellationDate: new Date().toISOString().split('T')[0],
      })
      .subscribe(() => this.loadVouchers());
  }

  private loadVouchers(): void {
    this.loading.set(true);
    this.voucherDataService.getVouchers(this.store.queryParams()).subscribe({
      next: (result: PaginatedResult<VoucherTableItem>) => {
        this.vouchers.set(result.items);
        this.totalCount.set(result.totalCount);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
