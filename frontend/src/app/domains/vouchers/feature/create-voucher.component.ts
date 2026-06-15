import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { VoucherDataService } from '../data/voucher-data.service';
import { WorkerDataService } from '../../workers/data/worker-data.service';
import { ApiService } from '../../../shared/services/api.service';
import { NomenclatorModel, BeneficiaryModel } from '../../../shared/models/voucher.model';
import { VoucherCreatedSummary, WorkerModel } from '../../../shared/models/voucher.model';
import { TranslatePipe } from '../../../shared/i18n/translate.pipe';
import { optionalEmailValidator, optionalPhoneValidator } from '../../../shared/validators/optional-contact.validators';
import { MaskIdnpPipe } from '../../../shared/pipes/mask-idnp.pipe';
import { AuthStore } from '../../../shared/auth/auth.store';

interface VoucherWorkerRow {
  id: string;
  workerId?: string;
  idnp: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  rspValidated: boolean;
  netRemuneration: number;
  hoursWorked: number;
}

@Component({
  selector: 'app-create-voucher',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, TranslatePipe, MaskIdnpPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-6xl mx-auto">
      <div class="mb-6">
        <a routerLink="/vouchers" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">&larr; {{ 'worker.profile.back' | t }}</a>
        <h1 class="text-3xl font-bold tracking-tight text-foreground mt-2">{{ 'voucher.create.title' | t }}</h1>
      </div>

      @if (!createdSummary()) {
        <!-- =========== SECTIUNEA 1: CAMPURI OBLIGATORII =========== -->
        <form [formGroup]="voucherForm" class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-foreground">{{ 'voucher.create.predefinedSection' | t }}</h2>
            <p class="text-sm text-muted-foreground mt-1">{{ 'voucher.create.predefinedHint' | t }}</p>
          </div>

          <!-- Company selector: Inspector only -->
          @if (isInspector()) {
            <div class="mb-4 space-y-2 relative">
              <label class="text-sm font-medium leading-none">Companie <span class="text-destructive">*</span></label>
              @if (selectedCompany()) {
                <div class="flex h-10 items-center gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm">
                  <span class="flex-1 font-medium truncate">{{ selectedCompany()!.companyName }}</span>
                  <span class="text-muted-foreground shrink-0">{{ selectedCompany()!.idno }}</span>
                  <button type="button" (click)="clearCompany()"
                    class="ml-2 shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                  </button>
                </div>
              } @else {
                <div class="relative">
                  <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  <input type="text" placeholder="Caută după denumire sau IDNO..."
                         [value]="companySearch()"
                         (input)="onCompanySearch($event)"
                         (focus)="companyDropdownOpen.set(true)"
                         class="flex h-10 w-full rounded-md border border-input bg-white pl-9 pr-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
                </div>
                @if (companyDropdownOpen() && companyResults().length > 0) {
                  <div class="fixed inset-0 z-[40]" (click)="companyDropdownOpen.set(false)"></div>
                  <div class="absolute left-0 right-0 top-full mt-1 z-[50] rounded-md border border-foreground/10 bg-white shadow-lg overflow-hidden"
                       (click)="$event.stopPropagation()">
                    @for (c of companyResults(); track c.id) {
                      <div class="flex items-center gap-3 px-3 py-2.5 hover:bg-accent cursor-pointer text-sm border-b border-foreground/5 last:border-0"
                           (click)="selectCompany(c)">
                        <span class="font-medium">{{ c.companyName }}</span>
                        <span class="text-muted-foreground ml-auto shrink-0">{{ c.idno }}</span>
                      </div>
                    }
                  </div>
                }
              }
            </div>
          }

          <!-- Row 1: Data, Ore, Remuneratie -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">{{ 'field.workDate' | t }} <span class="text-destructive">*</span></label>
              <input type="date" formControlName="workDate"
                class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">{{ 'voucher.create.defaultHours' | t }} <span class="text-destructive">*</span></label>
              <input type="number" formControlName="defaultHours" min="1" max="8"
                class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">{{ 'voucher.create.defaultRem' | t }} <span class="text-destructive">*</span></label>
              <input type="number" formControlName="defaultRemuneration" min="1"
                class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </div>
          </div>

          <!-- Row 2: Raion, Localitate -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">{{ "field.district" | t }} <span class="text-destructive">*</span></label>
              <div class="relative">
                <button type="button"
                  (click)="districtDropdownOpen.set(!districtDropdownOpen()); $event.stopPropagation()"
                  [class]="'flex h-10 w-full items-center rounded-md border bg-white px-3 py-1 text-sm shadow-xs outline-none text-left ' + (voucherForm.get('workDistrict')?.invalid && voucherForm.get('workDistrict')?.touched ? 'border-destructive' : 'border-input')">
                  <span class="block flex-1 truncate" [class.text-muted-foreground]="!selectedDistrict()">
                    {{ selectedDistrict() || 'Selectati raionul' }}
                  </span>
                  <svg class="ml-2 h-3 w-3 flex-shrink-0 text-foreground/60" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                @if (districtDropdownOpen()) {
                  <div class="fixed inset-0 z-[40]" (click)="districtDropdownOpen.set(false)"></div>
                  <div class="absolute left-0 right-0 top-full mt-1 z-[50] max-h-64 overflow-hidden flex flex-col rounded-md border border-foreground/10 bg-white shadow-lg"
                       (click)="$event.stopPropagation()">
                    <div class="p-2 border-b border-foreground/10">
                      <div class="relative">
                        <svg class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" placeholder="Cauta raion..."
                          [value]="districtSearch()"
                          (input)="districtSearch.set($any($event.target).value)"
                          class="w-full h-8 pl-8 pr-2 text-sm border border-input rounded outline-none focus-visible:border-ring" />
                      </div>
                    </div>
                    <div class="overflow-y-auto flex-1">
                      @if (filteredDistricts().length === 0) {
                        <div class="px-3 py-4 text-sm text-muted-foreground text-center">Niciun raion gasit</div>
                      } @else {
                        @for (d of filteredDistricts(); track d) {
                          <div class="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                               (click)="selectDistrict(d)">
                            @if (selectedDistrict() === d) {
                              <svg class="h-3.5 w-3.5 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                            } @else {
                              <span class="h-3.5 w-3.5 flex-shrink-0"></span>
                            }
                            {{ d }}
                          </div>
                        }
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">{{ "field.locality" | t }} <span class="text-destructive">*</span></label>
              <div class="relative">
                <button type="button"
                  [disabled]="!selectedDistrict()"
                  (click)="localityDropdownOpen.set(!localityDropdownOpen()); $event.stopPropagation()"
                  [class]="'flex h-10 w-full items-center rounded-md border bg-white px-3 py-1 text-sm shadow-xs outline-none text-left ' + (!selectedDistrict() ? 'opacity-50 cursor-not-allowed ' : '') + (voucherForm.get('workLocality')?.invalid && voucherForm.get('workLocality')?.touched ? 'border-destructive' : 'border-input')">
                  <span class="block flex-1 truncate" [class.text-muted-foreground]="!selectedLocalityValue()">
                    {{ selectedLocalityValue() || (!selectedDistrict() ? 'Selectati mai intai raionul' : 'Selectati localitatea') }}
                  </span>
                  <svg class="ml-2 h-3 w-3 flex-shrink-0 text-foreground/60" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                @if (localityDropdownOpen() && selectedDistrict()) {
                  <div class="fixed inset-0 z-[40]" (click)="localityDropdownOpen.set(false)"></div>
                  <div class="absolute left-0 right-0 top-full mt-1 z-[50] max-h-64 overflow-hidden flex flex-col rounded-md border border-foreground/10 bg-white shadow-lg"
                       (click)="$event.stopPropagation()">
                    <div class="p-2 border-b border-foreground/10">
                      <div class="relative">
                        <svg class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" placeholder="Cauta localitate..."
                          [value]="localitySearch()"
                          (input)="localitySearch.set($any($event.target).value)"
                          class="w-full h-8 pl-8 pr-2 text-sm border border-input rounded outline-none focus-visible:border-ring" />
                      </div>
                    </div>
                    <div class="overflow-y-auto flex-1">
                      @if (filteredLocalities().length === 0) {
                        <div class="px-3 py-4 text-sm text-muted-foreground text-center">Nicio localitate gasita</div>
                      } @else {
                        @for (loc of filteredLocalities(); track loc) {
                          <div class="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                               (click)="selectLocality(loc)">
                            @if (selectedLocalityValue() === loc) {
                              <svg class="h-3.5 w-3.5 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                            } @else {
                              <span class="h-3.5 w-3.5 flex-shrink-0"></span>
                            }
                            {{ loc }}
                          </div>
                        }
                      }
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Row 3: Adresa + Activitate + Tag -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">{{ "field.address" | t }} <span class="text-destructive">*</span></label>
              <input type="text" formControlName="workAddress" placeholder="str. Exemplu 1/2"
                class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
            </div>
            <div class="space-y-2">
              <label class="text-sm font-medium leading-none">Activitatea realizata <span class="text-destructive">*</span></label>
              <div class="relative">
                <button type="button"
                  (click)="activityDropdownOpen.set(!activityDropdownOpen()); $event.stopPropagation()"
                  [class]="'flex h-10 w-full items-center rounded-md border bg-white px-3 py-1 text-sm shadow-xs outline-none text-left ' + (voucherForm.get('activityType')?.invalid && voucherForm.get('activityType')?.touched ? 'border-destructive' : 'border-input')">
                  <span class="block flex-1 truncate" [class.text-muted-foreground]="!selectedActivityCode()">
                    {{ selectedActivityLabel() || 'Selectati activitatea' }}
                  </span>
                  <svg class="ml-2 h-3 w-3 flex-shrink-0 text-foreground/60" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                @if (activityDropdownOpen()) {
                  <div class="fixed inset-0 z-[40]" (click)="activityDropdownOpen.set(false)"></div>
                  <div class="absolute left-0 right-0 top-full mt-1 z-[50] max-h-72 overflow-hidden flex flex-col rounded-md border border-foreground/10 bg-white shadow-lg"
                       (click)="$event.stopPropagation()">
                    <div class="p-2 border-b border-foreground/10">
                      <div class="relative">
                        <svg class="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                        <input type="text" placeholder="Cauta activitate..."
                          [value]="activitySearch()"
                          (input)="activitySearch.set($any($event.target).value)"
                          class="w-full h-8 pl-8 pr-2 text-sm border border-input rounded outline-none focus-visible:border-ring" />
                      </div>
                    </div>
                    <div class="overflow-y-auto flex-1">
                      @if (filteredActivityTypes().length === 0) {
                        <div class="px-3 py-4 text-sm text-muted-foreground text-center">Nicio activitate gasita</div>
                      } @else {
                        @for (a of filteredActivityTypes(); track a.id) {
                          <div class="flex items-center gap-2 px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                               (click)="selectActivity(a)">
                            @if (selectedActivityCode() === a.code) {
                              <svg class="h-3.5 w-3.5 flex-shrink-0 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>
                            } @else {
                              <span class="h-3.5 w-3.5 flex-shrink-0"></span>
                            }
                            <span>{{ a.titleRo }}</span>
                          </div>
                        }
                      }
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- Tag (activitate specifică) -->
            <div class="space-y-2 relative">
              <label class="text-sm font-medium leading-none">Tag / Activitate specifică</label>
              <input type="text"
                [value]="tagInput()"
                (input)="onTagInput($any($event.target).value)"
                (focus)="tagDropdownOpen.set(true)"
                (keydown.enter)="confirmTag(); $event.preventDefault()"
                (keydown.escape)="tagDropdownOpen.set(false)"
                placeholder="ex: cirese, grau, etc."
                class="flex h-10 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50" />
              @if (tagDropdownOpen() && filteredExistingTags().length > 0) {
                <div class="fixed inset-0 z-[40]" (click)="tagDropdownOpen.set(false)"></div>
                <div class="absolute left-0 right-0 top-full mt-1 z-[50] max-h-48 overflow-y-auto rounded-md border border-foreground/10 bg-white shadow-lg"
                     (click)="$event.stopPropagation()">
                  @for (t of filteredExistingTags(); track t) {
                    <div class="px-3 py-2 hover:bg-accent cursor-pointer text-sm"
                         (click)="selectTag(t)">
                      {{ t }}
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </form>

        <!-- =========== SECTIUNEA 2: LUCRATORI =========== -->
        <div class="bg-card text-card-foreground rounded-xl ring-1 ring-foreground/10 shadow-xs p-6 mb-6">
          <div class="mb-4">
            <h2 class="text-lg font-semibold text-foreground">{{ "voucher.create.workersSection" | t }}</h2>
            <p class="text-sm text-muted-foreground mt-1">{{ "voucher.create.workersHint" | t }}</p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <button type="button" (click)="openPanel('add')"
              class="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-md text-sm font-semibold transition-colors bg-primary text-primary-foreground shadow-xs hover:bg-primary/90">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
              {{ 'voucher.create.addWorkers' | t }}
            </button>

            <button type="button" (click)="openPanel('csv')"
              class="inline-flex items-center justify-center gap-2 h-11 px-4 rounded-md text-sm font-semibold transition-colors border border-input bg-background hover:bg-accent hover:text-accent-foreground">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              {{ 'voucher.create.importWorkers' | t }}
            </button>
          </div>

          <!-- MODAL: ADAUGA LUCRATORI (with two tabs) -->
          @if (panel() === 'add') {
            <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" (click)="panel.set(null)">
              <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col" (click)="$event.stopPropagation()">
                <div class="p-6 pb-4 border-b border-foreground/10">
                  <h3 class="text-lg font-semibold">{{ 'voucher.create.addWorkers' | t }}</h3>
                  <p class="text-sm text-muted-foreground">Selectati lucratori din registrul RSP sau adaugati unul nou.</p>
                </div>

                <!-- Tabs -->
                <div class="px-6 border-b border-foreground/10">
                  <nav class="flex gap-6">
                    <button type="button" (click)="addTab.set('existing')"
                      [class]="addTab() === 'existing'
                        ? 'relative pb-3 pt-3 text-sm font-medium text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground'
                        : 'pb-3 pt-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'">
                      {{ 'voucher.create.tabExisting' | t }}
                    </button>
                    <button type="button" (click)="addTab.set('new')"
                      [class]="addTab() === 'new'
                        ? 'relative pb-3 pt-3 text-sm font-medium text-foreground after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-foreground'
                        : 'pb-3 pt-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors'">
                      {{ 'voucher.create.tabNew' | t }}
                    </button>
                  </nav>
                </div>

                <!-- Tab content -->
                <div class="p-6 overflow-y-auto flex-1">
                  @if (addTab() === 'existing') {
                    <div class="relative mb-3">
                      <svg class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      <input type="text" [value]="searchTerm()" (input)="searchTerm.set($any($event.target).value)"
                        placeholder="Cauta dupa IDNP, nume, prenume..."
                        class="flex h-9 w-full rounded-md border border-input bg-white pl-9 pr-3 py-1 text-sm" />
                    </div>
                    <div class="max-h-80 overflow-auto rounded-md ring-1 ring-foreground/10 bg-white">
                      @if (loadingWorkers()) {
                        <div class="p-6 text-center text-sm text-muted-foreground">Se incarca...</div>
                      } @else if (filteredAvailableWorkers().length === 0) {
                        <div class="p-6 text-center text-sm text-muted-foreground">Nu au fost gasiti lucratori.</div>
                      } @else {
                        <table class="w-full text-sm">
                          <tbody>
                            @for (w of filteredAvailableWorkers(); track w.id) {
                              <tr class="border-t border-foreground/5 hover:bg-muted/30 cursor-pointer first:border-t-0" (click)="addFromExisting(w)">
                                <td class="p-3">
                                  <div class="font-medium">{{ w.lastName }} {{ w.firstName }}</div>
                                  <div class="text-xs text-muted-foreground font-mono">{{ w.idnp | maskIdnp }}</div>
                                </td>
                                <td class="p-3 text-right">
                                  @if (w.rspValidated) {
                                    <span class="inline-flex items-center gap-1 text-xs text-green-600"><span class="size-1.5 rounded-full bg-green-500"></span>RSP validat</span>
                                  }
                                </td>
                                <td class="p-3 w-24 text-right">
                                  <span class="inline-flex items-center gap-1 text-sm font-medium text-primary">+ Adauga</span>
                                </td>
                              </tr>
                            }
                          </tbody>
                        </table>
                      }
                    </div>
                  } @else {
                    <!-- RSP info banner -->
                    <div class="mb-4 flex items-start gap-3 rounded-md bg-primary/5 ring-1 ring-primary/20 p-3 text-sm">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-5 text-primary flex-shrink-0 mt-0.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                      <div>
                        <span class="font-semibold text-foreground">{{ 'voucher.create.rspBanner' | t }}</span>
                        <span class="text-muted-foreground"> {{ 'voucher.create.rspBannerText' | t }}</span>
                      </div>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3" [formGroup]="newWorkerForm">
                      <div class="space-y-1.5">
                        <label class="text-xs text-muted-foreground">Nume *</label>
                        <input type="text" formControlName="lastName" placeholder="Popescu"
                          class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                      </div>
                      <div class="space-y-1.5">
                        <label class="text-xs text-muted-foreground">Prenume *</label>
                        <input type="text" formControlName="firstName" placeholder="Ion"
                          class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                      </div>
                      <div class="space-y-1.5">
                        <label class="text-xs text-muted-foreground">IDNP *</label>
                        <input type="text" formControlName="idnp" maxlength="13" placeholder="13 cifre"
                          class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                      </div>
                      <div class="space-y-1.5">
                        <label class="text-xs text-muted-foreground">Data nașterii *</label>
                        <input type="date" formControlName="birthDate" [max]="todayIso"
                          class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                      </div>
                      <div class="space-y-1.5">
                        <label class="text-xs text-muted-foreground">Telefon (optional)</label>
                        <input type="tel" formControlName="phone" placeholder="+37360123456"
                          class="flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm"
                          [class.border-destructive]="newWorkerForm.controls.phone.invalid && newWorkerForm.controls.phone.touched"
                          [class.border-input]="!(newWorkerForm.controls.phone.invalid && newWorkerForm.controls.phone.touched)" />
                        @if (newWorkerForm.controls.phone.touched && newWorkerForm.controls.phone.errors?.['phoneFormat']) {
                          <p class="text-xs text-destructive">
                            Format Moldova: +373 urmat de 8 cifre (fara spatii).
                          </p>
                        }
                      </div>
                      <div class="space-y-1.5">
                        <label class="text-xs text-muted-foreground">Email (optional)</label>
                        <input type="email" formControlName="email" placeholder="ion.popescu@example.md"
                          class="flex h-9 w-full rounded-md border bg-white px-3 py-1 text-sm"
                          [class.border-destructive]="newWorkerForm.controls.email.invalid && newWorkerForm.controls.email.touched"
                          [class.border-input]="!(newWorkerForm.controls.email.invalid && newWorkerForm.controls.email.touched)" />
                        @if (newWorkerForm.controls.email.touched && newWorkerForm.controls.email.errors?.['email']) {
                          <p class="text-xs text-destructive">Format email invalid (ex: nume&#64;domeniu.md).</p>
                        }
                      </div>
                    </div>
                  }
                </div>

                <div class="p-6 pt-4 border-t border-foreground/10 flex justify-end gap-2">
                  <button type="button" (click)="panel.set(null)"
                    class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">
                    @if (addTab() === 'existing') { Inchide } @else { Anuleaza }
                  </button>
                  @if (addTab() === 'new') {
                    <button type="button" (click)="addNewWorker()" [disabled]="newWorkerForm.invalid"
                      class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium disabled:opacity-50">
                      + Adauga in voucher
                    </button>
                  }
                </div>
              </div>
            </div>
          }

          <!-- MODAL: CSV IMPORT -->
          @if (panel() === 'csv') {
            <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" (click)="panel.set(null)">
              <div class="bg-white rounded-xl shadow-2xl w-full max-w-2xl" (click)="$event.stopPropagation()">
                <div class="p-6 pb-4 border-b border-foreground/10">
                  <h3 class="text-lg font-semibold">{{ 'voucher.create.importWorkers' | t }}</h3>
                  <p class="text-sm text-muted-foreground">Fiecare linie: <span class="font-mono">Nume,Prenume,IDNP[,Telefon,Email]</span> &mdash; telefon si email sunt optionale.</p>
                </div>
                <div class="p-6">
                  <textarea rows="8" [value]="csvText()" (input)="csvText.set($any($event.target).value)"
                    placeholder="Popescu,Ion,2001234567890&#10;Codreanu,Maria,2009876543210,+37360111222,maria@example.md"
                    class="w-full rounded-md border border-input bg-white px-3 py-2 text-sm font-mono"></textarea>
                  @if (csvError()) {
                    <div class="mt-2 text-xs text-destructive">{{ csvError() }}</div>
                  }
                </div>
                <div class="p-6 pt-4 border-t border-foreground/10 flex justify-end gap-2">
                  <button type="button" (click)="panel.set(null)"
                    class="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 text-sm">Anuleaza</button>
                  <button type="button" (click)="importCsv()"
                    class="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">
                    Importa
                  </button>
                </div>
              </div>
            </div>
          }

          <!-- WORKER CARDS -->
          @if (rows().length === 0) {
            <div class="rounded-md border border-dashed border-foreground/20 p-8 text-center text-sm text-muted-foreground">
              {{ 'voucher.create.emptyWorkers' | t }}
            </div>
          } @else {
            <div class="space-y-3">
              @for (row of rows(); track row.id; let i = $index) {
                <div class="rounded-md ring-1 ring-foreground/10 bg-white overflow-hidden border-l-4 border-l-green-500">
                  <!-- Header -->
                  <div class="flex items-center gap-3 px-4 py-3 bg-muted/20">
                    <div class="size-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm flex-shrink-0">
                      {{ initials(row) }}
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2">
                        <div class="font-semibold text-foreground">{{ row.lastName }} {{ row.firstName }}</div>
                        @if (row.rspValidated) {
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4 text-green-500" title="RSP validat"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>
                        }
                      </div>
                      <div class="text-xs text-muted-foreground">IDNP: {{ row.idnp | maskIdnp }}</div>
                    </div>
                    <div class="flex items-center gap-1">
                      <button type="button" (click)="removeRow(i)" class="size-8 inline-flex items-center justify-center rounded-md hover:bg-destructive/10 text-destructive" title="Sterge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="size-4"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Always-editable fields -->
                  <div class="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div class="space-y-1.5">
                      <label class="text-xs text-muted-foreground">Remunerare neta (MDL) *</label>
                      <input type="number" min="1" [value]="row.netRemuneration" (input)="updateRow(i, 'netRemuneration', +$any($event.target).value)"
                        class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-xs text-muted-foreground">Ore de munca *</label>
                      <input type="number" min="1" max="8" [value]="row.hoursWorked" (input)="updateRow(i, 'hoursWorked', +$any($event.target).value)"
                        class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-xs text-muted-foreground">Telefon</label>
                      <input type="tel" [value]="row.phone || ''" (input)="updateRow(i, 'phone', $any($event.target).value)"
                        class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                    </div>
                    <div class="space-y-1.5">
                      <label class="text-xs text-muted-foreground">Email</label>
                      <input type="email" [value]="row.email || ''" (input)="updateRow(i, 'email', $any($event.target).value)"
                        class="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm" />
                    </div>
                  </div>

                </div>
              }
            </div>
          }
        </div>

        <!-- TOTALS + SUBMIT -->
        @if (rows().length > 0) {
          <div class="bg-primary/10 rounded-xl ring-1 ring-primary/20 p-4 mb-4">
            <h3 class="text-sm font-semibold text-foreground mb-2">{{ 'voucher.create.totalSummary' | t }}</h3>
            <div class="grid grid-cols-2 md:grid-cols-2 gap-4 text-sm">
              <div><span class="text-muted-foreground">Vouchere:</span> <strong>{{ rows().length }}</strong></div>
              <div><span class="text-muted-foreground">Total brut:</span> <strong>{{ totalGross() }} MDL</strong></div>
            </div>
          </div>
        }

        @if (errorMessage()) {
          <div class="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-sm text-destructive">{{ errorMessage() }}</div>
        }

        <div class="flex justify-end gap-2">
          <a routerLink="/vouchers" class="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium">Anuleaza</a>
          <button type="button" (click)="onSubmit()" [disabled]="submitting() || rows().length === 0"
            class="inline-flex h-10 items-center justify-center rounded-md bg-primary text-primary-foreground px-6 text-sm font-semibold disabled:opacity-50">
            @if (submitting()) { {{ 'common.processing' | t }} } @else { {{ 'voucher.create.submit' | t }} }
          </button>
        </div>
      } @else {
        <!-- SUCCESS -->
        <div class="bg-success/10 rounded-xl ring-1 ring-success/20 p-6">
          <h2 class="text-lg font-semibold text-success mb-4">{{ 'voucher.create.success' | t }}</h2>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
            <div><span class="text-success">Total vouchere:</span> <strong>{{ createdSummary()!.totalVouchers }}</strong></div>
            <div><span class="text-success">Total net:</span> <strong>{{ createdSummary()!.totalNet }} MDL</strong></div>
            <div><span class="text-success">Total impozit:</span> <strong>{{ createdSummary()!.totalTax }} MDL</strong></div>
            <div><span class="text-success">Total brut:</span> <strong>{{ createdSummary()!.totalGross }} MDL</strong></div>
          </div>
          <div class="border-t border-success/20 pt-4">
            <h3 class="text-sm font-medium mb-2">{{ 'voucher.create.successCodes' | t }}</h3>
            <div class="flex flex-wrap gap-2">
              @for (v of createdSummary()!.vouchers; track v.id) {
                <span class="inline-flex items-center px-3 py-1 bg-card ring-1 ring-success/30 rounded-full text-sm font-mono text-success">{{ v.code }}</span>
              }
            </div>
          </div>
          <div class="mt-6 flex gap-3">
            <a routerLink="/vouchers" class="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium">Inapoi la lista</a>
            <button type="button" (click)="createAnother()" class="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium">{{ 'voucher.create.another' | t }}</button>
          </div>
        </div>
      }
    </div>
  `,
})
export class CreateVoucherComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly voucherDataService = inject(VoucherDataService);
  private readonly workerDataService = inject(WorkerDataService);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthStore);

  protected readonly isInspector = computed(() => this.auth.roleType() === 'Inspector');

  // Company selector (Inspector only)
  protected readonly companySearch = signal('');
  protected readonly companyDropdownOpen = signal(false);
  protected readonly companyResults = signal<BeneficiaryModel[]>([]);
  protected readonly selectedCompany = signal<BeneficiaryModel | null>(null);
  private companySearchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly activityTypes = signal<NomenclatorModel[]>([]);
  protected readonly existingTags = signal<string[]>([]);

  // Searchable dropdowns
  protected readonly activitySearch = signal('');
  protected readonly activityDropdownOpen = signal(false);
  protected readonly tagInput = signal('');
  protected readonly tagDropdownOpen = signal(false);
  protected readonly selectedActivityCode = signal('');
  protected readonly districtSearch = signal('');
  protected readonly districtDropdownOpen = signal(false);
  protected readonly localitySearch = signal('');
  protected readonly localityDropdownOpen = signal(false);
  protected readonly selectedLocalityValue = signal('');

  protected readonly submitting = signal(false);
  protected readonly errorMessage = signal('');
  protected readonly createdSummary = signal<VoucherCreatedSummary | null>(null);

  protected readonly loadingWorkers = signal(false);
  protected readonly allWorkers = signal<WorkerModel[]>([]);
  protected readonly searchTerm = signal('');

  protected readonly panel = signal<null | 'add' | 'csv'>(null);
  protected readonly addTab = signal<'existing' | 'new'>('existing');

  protected readonly csvText = signal('');
  protected readonly csvError = signal('');

  protected readonly rows = signal<VoucherWorkerRow[]>([]);

  // Track prev default values to avoid overwriting user edits
  private prevDefaultHours = 8;
  private prevDefaultRemuneration = 0;

  // District -> list of localities map
  private readonly districtLocalities: Record<string, string[]> = {
    Chisinau: ['mun. Chisinau', 'Buiucani', 'Centru', 'Botanica', 'Ciocana', 'Riscani', 'Durlesti', 'Vatra', 'Codru', 'Cricova', 'Sangera', 'Stauceni', 'Ialoveni', 'Straseni'],
    Balti: ['mun. Balti', 'Singerei', 'Falesti', 'Glodeni', 'Riscani'],
    Cahul: ['mun. Cahul', 'Cantemir', 'Taraclia', 'Vulcanesti'],
    Orhei: ['mun. Orhei', 'Criuleni', 'Rezina', 'Telenesti', 'Soldanesti'],
    Ungheni: ['mun. Ungheni', 'Nisporeni', 'Calarasi'],
    Soroca: ['mun. Soroca', 'Drochia', 'Floresti', 'Donduseni'],
    Edinet: ['mun. Edinet', 'Briceni', 'Ocnita', 'Riscani'],
    Comrat: ['mun. Comrat', 'Ceadir-Lunga', 'Vulcanesti', 'Basarabeasca'],
  };

  protected readonly selectedDistrict = signal<string>('');

  protected readonly localitiesForDistrict = computed(() => {
    const d = this.selectedDistrict();
    return d ? (this.districtLocalities[d] || []) : [];
  });

  protected readonly selectedActivityLabel = computed(() => {
    const code = this.selectedActivityCode();
    return code ? (this.activityTypes().find(a => a.code === code)?.titleRo ?? '') : '';
  });
  protected readonly filteredActivityTypes = computed(() => {
    const term = this.activitySearch().toLowerCase();
    const list = this.activityTypes();
    return term ? list.filter(a => a.titleRo.toLowerCase().includes(term) || a.code.toLowerCase().includes(term)) : list;
  });
  protected readonly filteredExistingTags = computed(() => {
    const term = this.tagInput().toLowerCase().trim();
    const tags = this.existingTags();
    return term ? tags.filter(t => t.toLowerCase().includes(term)) : tags;
  });
  protected readonly districtList = ['Chisinau', 'Balti', 'Cahul', 'Orhei', 'Ungheni', 'Soroca', 'Edinet', 'Comrat'];
  protected readonly filteredDistricts = computed(() => {
    const term = this.districtSearch().toLowerCase();
    return term ? this.districtList.filter(d => d.toLowerCase().includes(term)) : this.districtList;
  });
  protected readonly filteredLocalities = computed(() => {
    const term = this.localitySearch().toLowerCase();
    const list = this.localitiesForDistrict();
    return term ? list.filter(l => l.toLowerCase().includes(term)) : list;
  });

  protected readonly filteredAvailableWorkers = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const addedIdnps = new Set(this.rows().map((r) => r.idnp));
    const list = this.allWorkers().filter((w) => !addedIdnps.has(w.idnp));
    if (!term) return list;
    return list.filter((w) =>
      w.idnp.includes(term) ||
      w.firstName.toLowerCase().includes(term) ||
      w.lastName.toLowerCase().includes(term)
    );
  });

  protected readonly totalNet = computed(() =>
    Math.round(this.rows().reduce((sum, r) => sum + (Number(r.netRemuneration) || 0), 0) * 100) / 100
  );
  protected readonly totalTax = computed(() => Math.round(this.totalNet() * 0.12 * 100) / 100);
  protected readonly totalCnas = computed(() => Math.round(this.totalNet() * 0.06 * 100) / 100);
  protected readonly totalGross = computed(() => Math.round((this.totalNet() + this.totalTax() + this.totalCnas()) * 100) / 100);

  protected readonly voucherForm = this.fb.group({
    workDate: [new Date().toISOString().split('T')[0], Validators.required],
    defaultHours: [8, [Validators.required, Validators.min(1), Validators.max(8)]],
    defaultRemuneration: [250, [Validators.required, Validators.min(1)]],
    workDistrict: ['', Validators.required],
    workLocality: ['', Validators.required],
    workAddress: ['', Validators.required],
    activityType: ['', Validators.required],
  });

  protected readonly newWorkerForm = this.fb.group({
    lastName: ['', Validators.required],
    firstName: ['', Validators.required],
    idnp: ['', [Validators.required, Validators.minLength(13), Validators.maxLength(13)]],
    birthDate: ['', Validators.required],
    // Optional. Validators apply ONLY when the field is non-empty (custom wrappers below).
    email: ['', [optionalEmailValidator]],
    phone: ['', [optionalPhoneValidator]],
  });

  protected readonly todayIso = new Date().toISOString().split('T')[0];

  constructor() {
    // Propagate default values to worker rows — only overwrite if the row still has the previous default
    // (so user edits are preserved).
    this.voucherForm.valueChanges.subscribe((v) => {
      const newHours = Number(v.defaultHours) || 8;
      const newRem = Number(v.defaultRemuneration) || 0;
      const newDistrict = v.workDistrict || '';
      if (newDistrict !== this.selectedDistrict()) {
        this.selectedDistrict.set(newDistrict);
        // Reset locality if the new district does not include it
        const currentLoc = v.workLocality || '';
        if (currentLoc && !this.localitiesForDistrict().includes(currentLoc)) {
          this.voucherForm.patchValue({ workLocality: '' }, { emitEvent: false });
          this.selectedLocalityValue.set('');
        }
      }
      if (newHours !== this.prevDefaultHours || newRem !== this.prevDefaultRemuneration) {
        this.rows.update((list) =>
          list.map((r) => ({
            ...r,
            hoursWorked: r.hoursWorked === this.prevDefaultHours ? newHours : r.hoursWorked,
            netRemuneration: r.netRemuneration === this.prevDefaultRemuneration ? newRem : r.netRemuneration,
          }))
        );
        this.prevDefaultHours = newHours;
        this.prevDefaultRemuneration = newRem;
      }
    });
    // Init prev values
    this.prevDefaultHours = this.voucherForm.value.defaultHours || 8;
    this.prevDefaultRemuneration = this.voucherForm.value.defaultRemuneration || 0;
  }

  ngOnInit(): void {
    this.loadingWorkers.set(true);
    this.workerDataService.getWorkers({ offset: 0, limit: 200 }).subscribe({
      next: (r) => {
        this.allWorkers.set(r.items);
        this.loadingWorkers.set(false);
      },
      error: () => this.loadingWorkers.set(false),
    });
    this.api.getNomenclators('activity_types').subscribe({
      next: (list) => this.activityTypes.set((list ?? []).filter((n) => n.isActive)),
    });
    this.api.getVoucherTags().subscribe({ next: (tags) => this.existingTags.set(tags ?? []) });
  }

  protected onTagInput(value: string): void {
    this.tagInput.set(value);
    this.tagDropdownOpen.set(true);
  }

  protected selectTag(tag: string): void {
    this.tagInput.set(tag);
    this.tagDropdownOpen.set(false);
  }

  protected confirmTag(): void {
    this.tagDropdownOpen.set(false);
  }

  protected selectActivity(a: NomenclatorModel): void {
    this.voucherForm.patchValue({ activityType: a.code });
    this.selectedActivityCode.set(a.code);
    this.activityDropdownOpen.set(false);
    this.activitySearch.set('');
  }

  protected selectDistrict(district: string): void {
    this.voucherForm.patchValue({ workDistrict: district, workLocality: '' });
    this.selectedDistrict.set(district);
    this.selectedLocalityValue.set('');
    this.districtDropdownOpen.set(false);
    this.districtSearch.set('');
  }

  protected selectLocality(loc: string): void {
    this.voucherForm.patchValue({ workLocality: loc });
    this.selectedLocalityValue.set(loc);
    this.localityDropdownOpen.set(false);
    this.localitySearch.set('');
  }

  protected openPanel(p: 'add' | 'csv'): void {
    this.panel.set(this.panel() === p ? null : p);
    if (p === 'add') {
      this.addTab.set('existing');
      this.searchTerm.set('');
      this.newWorkerForm.reset();
    }
    if (p === 'csv') {
      this.csvText.set('');
      this.csvError.set('');
    }
  }

  private defaults() {
    const v = this.voucherForm.value;
    return {
      hours: Number(v.defaultHours) || 8,
      rem: Number(v.defaultRemuneration) || 0,
    };
  }

  protected addNewWorker(): void {
    if (this.newWorkerForm.invalid) {
      this.newWorkerForm.markAllAsTouched();
      return;
    }
    const v = this.newWorkerForm.getRawValue();
    const { hours, rem } = this.defaults();
    this.rows.update((list) => [...list, {
      id: `new-${v.idnp}-${Date.now()}`,
      idnp: v.idnp!,
      firstName: v.firstName!,
      lastName: v.lastName!,
      birthDate: v.birthDate!,
      netRemuneration: rem,
      hoursWorked: hours,
      rspValidated: false,
      phone: v.phone?.trim() || undefined,
      email: v.email?.trim() || undefined,
    }]);
    this.newWorkerForm.reset();
    this.panel.set(null);
  }

  protected addFromExisting(w: WorkerModel): void {
    if (this.rows().some((r) => r.idnp === w.idnp)) return;
    const { hours, rem } = this.defaults();
    this.rows.update((list) => [...list, {
      id: w.id,
      workerId: w.id,
      idnp: w.idnp,
      firstName: w.firstName,
      lastName: w.lastName,
      birthDate: w.birthDate,
      phone: w.phone,
      email: w.email,
      rspValidated: w.rspValidated,
      netRemuneration: rem,
      hoursWorked: hours,
    }]);
  }

  protected importCsv(): void {
    this.csvError.set('');
    const lines = this.csvText().split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      this.csvError.set('Nu exista date de importat.');
      return;
    }
    const { hours, rem } = this.defaults();
    const newRows: VoucherWorkerRow[] = [];
    const existing = new Set(this.rows().map((r) => r.idnp));
    for (let idx = 0; idx < lines.length; idx++) {
      const parts = lines[idx].split(',').map((x) => x.trim());
      if (parts.length < 3) {
        this.csvError.set(`Linia ${idx + 1}: format invalid (asteptat Nume,Prenume,IDNP[,Telefon,Email])`);
        return;
      }
      const [lastName, firstName, idnp, phoneRaw, emailRaw] = parts;
      if (idnp.length !== 13) {
        this.csvError.set(`Linia ${idx + 1}: IDNP trebuie sa fie exact 13 cifre.`);
        return;
      }
      // Optional phone: validate only if non-empty
      const phone = (phoneRaw || '').trim();
      if (phone) {
        if (!/^[+\d\s\-()]+$/.test(phone)) {
          this.csvError.set(`Linia ${idx + 1}: telefon contine caractere nepermise.`);
          return;
        }
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 7 || digits.length > 15) {
          this.csvError.set(`Linia ${idx + 1}: telefonul trebuie sa contina intre 7 si 15 cifre.`);
          return;
        }
      }
      // Optional email: validate only if non-empty
      const email = (emailRaw || '').trim();
      if (email && !/^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/.test(email)) {
        this.csvError.set(`Linia ${idx + 1}: format email invalid.`);
        return;
      }
      if (existing.has(idnp)) continue;
      existing.add(idnp);
      newRows.push({
        id: `csv-${idnp}-${Date.now()}-${idx}`,
        idnp,
        firstName,
        lastName,
        netRemuneration: rem,
        hoursWorked: hours,
        rspValidated: false,
        phone: phone || undefined,
        email: email || undefined,
      });
    }
    this.rows.update((list) => [...list, ...newRows]);
    this.panel.set(null);
    this.csvText.set('');
  }

  protected updateRow(i: number, key: keyof VoucherWorkerRow, value: any): void {
    this.rows.update((list) => {
      const copy = [...list];
      copy[i] = { ...copy[i], [key]: value };
      return copy;
    });
  }

  protected removeRow(i: number): void {
    this.rows.update((list) => list.filter((_, idx) => idx !== i));
  }

  protected taxOf(row: VoucherWorkerRow) {
    const net = Number(row.netRemuneration) || 0;
    const tax = Math.round(net * 0.12 * 100) / 100;
    const cnas = Math.round(net * 0.06 * 100) / 100;
    return { tax, cnas, gross: Math.round((net + tax + cnas) * 100) / 100 };
  }

  protected initials(row: VoucherWorkerRow): string {
    return `${(row.lastName?.[0] || '').toUpperCase()}${(row.firstName?.[0] || '').toUpperCase()}` || '?';
  }

  private ageFromIso(birthIso: string, atIso?: string): number | null {
    if (!birthIso) return null;
    const [by, bm, bd] = birthIso.split('-').map(Number);
    if (!by || !bm || !bd) return null;
    const ref = atIso ? new Date(atIso) : new Date();
    if (isNaN(ref.getTime())) return null;
    let age = ref.getFullYear() - by;
    const rm = ref.getMonth() + 1;
    const rd = ref.getDate();
    if (rm < bm || (rm === bm && rd < bd)) age--;
    return age;
  }

  protected formatDate(iso: string): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}.${m}.${y}`;
  }

  private focusFirstInvalid(): void {
    queueMicrotask(() => {
      const el = document.querySelector<HTMLElement>(
        'input.ng-invalid[formcontrolname], select.ng-invalid[formcontrolname], textarea.ng-invalid[formcontrolname]'
      );
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (typeof (el as HTMLInputElement).focus === 'function') (el as HTMLInputElement).focus();
      }
    });
  }

  onCompanySearch(e: Event): void {
    const term = (e.target as HTMLInputElement).value;
    this.companySearch.set(term);
    if (this.companySearchTimer) clearTimeout(this.companySearchTimer);
    if (term.length < 2) { this.companyResults.set([]); return; }
    this.companySearchTimer = setTimeout(() => {
      this.api.getBeneficiaries({ search: term, limit: 8, offset: 0 }).subscribe({
        next: r => this.companyResults.set(r.items),
      });
    }, 300);
  }

  selectCompany(c: BeneficiaryModel): void {
    this.selectedCompany.set(c);
    this.companyDropdownOpen.set(false);
    this.companyResults.set([]);
    this.companySearch.set('');
  }

  clearCompany(): void {
    this.selectedCompany.set(null);
    this.companySearch.set('');
  }

  protected onSubmit(): void {
    if (this.isInspector() && !this.selectedCompany()) {
      this.errorMessage.set('Selectează compania pentru care creezi voucherele.');
      return;
    }
    if (this.voucherForm.invalid) {
      this.voucherForm.markAllAsTouched();
      this.errorMessage.set('Completati toate campurile obligatorii.');
      this.focusFirstInvalid();
      return;
    }
    if (this.rows().length === 0) {
      this.errorMessage.set('Adaugati cel putin un lucrator.');
      return;
    }
    if (this.rows().some((r) => !r.netRemuneration || r.netRemuneration < 1)) {
      this.errorMessage.set('Completati remunerarea neta pentru toti lucratorii.');
      return;
    }

    // Art. 13 validation — hours per age:
    //   15-16 ani: max 5h
    //   16-18 ani: max 7h
    //   18+ ani:   max 8h
    for (const r of this.rows()) {
      if (!r.birthDate) continue; // will be verified via RSP on backend
      const age = this.ageFromIso(r.birthDate, this.voucherForm.value.workDate || undefined);
      if (age == null) continue;
      if (age < 15) {
        this.errorMessage.set(`Lucrator ${r.lastName} ${r.firstName}: virsta sub 15 ani nu este permisa conform Art. 13.`);
        return;
      }
      const maxHours = age < 16 ? 5 : age < 18 ? 7 : 8;
      if (r.hoursWorked > maxHours) {
        this.errorMessage.set(`Lucrator ${r.lastName} ${r.firstName} (${age} ani): maxim ${maxHours}h permise conform Art. 13 (ati introdus ${r.hoursWorked}h).`);
        return;
      }
    }

    this.submitting.set(true);
    this.errorMessage.set('');

    const v = this.voucherForm.getRawValue();
    const request = {
      workDate: v.workDate!,
      hoursWorked: v.defaultHours!,
      workDistrict: v.workDistrict!,
      workLocality: v.workLocality!,
      workAddress: v.workAddress || undefined,
      activityType: v.activityType || undefined,
      tag: this.tagInput().trim() || undefined,
      art5Alin1LitB: false,
      art5Alin1LitG: false,
      ...(this.isInspector() && { beneficiaryId: this.selectedCompany()!.id }),
      workers: this.rows().map((r) => ({
        idnp: r.idnp,
        firstName: r.firstName,
        lastName: r.lastName,
        birthDate: r.birthDate || '1990-01-01',
        netRemuneration: Number(r.netRemuneration),
        phone: r.phone || undefined,
        email: r.email || undefined,
      })),
    };

    this.voucherDataService.createVouchers(request).subscribe({
      next: (summary) => {
        this.createdSummary.set(summary);
        this.submitting.set(false);
      },
      error: (err) => {
        this.submitting.set(false);
        const fieldErrors: Array<{ propertyName?: string; errorMessage?: string }> =
          Array.isArray(err?.error?.errors) ? err.error.errors : [];
        const workerErrors = fieldErrors
          .filter((f) => /workerid$/i.test(f.propertyName ?? ''))
          .map((f) => f.errorMessage)
          .filter((m): m is string => !!m);
        if (workerErrors.length > 0) {
          this.errorMessage.set(workerErrors.join(' '));
        } else {
          this.errorMessage.set(err.error?.message || 'Eroare la crearea voucherelor.');
        }
      },
    });
  }

  protected createAnother(): void {
    this.createdSummary.set(null);
    this.rows.set([]);
    this.panel.set(null);
    this.selectedActivityCode.set('');
    this.selectedLocalityValue.set('');
    this.tagInput.set('');
    this.voucherForm.reset({
      workDate: new Date().toISOString().split('T')[0],
      defaultHours: 8,
      defaultRemuneration: 250,
    });
  }
}
