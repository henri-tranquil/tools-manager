import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { formatDecimal, parseDecimal } from '../../../shared/format';
import { estimateLoadSeconds, maxWeightKb, NETWORKS } from './load-time';

@Component({
  selector: 'app-budget-poids',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tool-layout">
      <div class="tool-layout__inputs">
        <label class="label">
          Poids de la page (Ko)
          <input
            #w
            class="field"
            type="text"
            inputmode="decimal"
            [value]="weight()"
            (input)="weight.set(w.value)"
          />
        </label>
        <label class="label">
          Nombre de requêtes
          <input
            #r
            class="field"
            type="text"
            inputmode="numeric"
            [value]="requests()"
            (input)="requests.set(r.value)"
          />
        </label>
        <label class="label">
          Temps cible (s)
          <input
            #t
            class="field"
            type="text"
            inputmode="decimal"
            [value]="target()"
            (input)="target.set(t.value)"
          />
        </label>
        <p class="note">
          Estimation : 3 allers-retours de connexion, requêtes par lots de 6, puis transfert au
          débit du réseau. Le rendu et le JavaScript ne sont pas comptés.
        </p>
      </div>
      <div class="tool-layout__results">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th scope="col">Réseau</th>
                <th scope="col" class="num">Débit</th>
                <th scope="col" class="num">Temps estimé</th>
                <th scope="col" class="num">Budget pour {{ target() || '—' }} s</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.id) {
                <tr>
                  <th scope="row">{{ row.label }}</th>
                  <td class="num">{{ row.speed }}</td>
                  <td class="num" [style.background]="row.ok ? 'var(--mint)' : 'var(--coral)'">
                    {{ row.time }}
                  </td>
                  <td class="num">{{ row.budget }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
})
export class BudgetPoids {
  protected readonly weight = signal('1500');
  protected readonly requests = signal('40');
  protected readonly target = signal('3');

  protected readonly rows = computed(() => {
    const size = parseDecimal(this.weight());
    const requests = parseDecimal(this.requests());
    const target = parseDecimal(this.target());
    const valid = size >= 0 && requests >= 0;
    return NETWORKS.map((network) => {
      const seconds = valid ? estimateLoadSeconds(size, requests, network) : Number.NaN;
      const budget =
        target > 0 && requests >= 0 ? maxWeightKb(target, requests, network) : Number.NaN;
      return {
        id: network.id,
        label: network.label,
        speed:
          network.downKbps >= 1000
            ? `${formatDecimal(network.downKbps / 1000, 1)} Mb/s`
            : `${network.downKbps} kb/s`,
        time: Number.isFinite(seconds) ? `${formatDecimal(seconds, 1)} s` : '—',
        ok: Number.isFinite(seconds) && !(target > 0 && seconds > target),
        budget: Number.isFinite(budget) ? `${formatDecimal(budget, 0)} Ko` : '—',
      };
    });
  });
}
