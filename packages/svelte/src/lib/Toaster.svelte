<script lang="ts">
  import { toast, injectStyles, bindToast, onToastKey, ICONS, type Position, type Theme, type ToastLabels } from '@yusufceng1z/ding';

  let { position, theme, labels }: { position?: Position; theme?: Theme; labels?: Partial<ToastLabels> } = $props();

  let state = $state(toast.getState());

  $effect(() => {
    injectStyles();
    state = toast.getState();
    return toast.subscribe(() => (state = toast.getState()));
  });
  $effect(() => toast.configure({ position, theme }));
  // Read the strings so the effect tracks them, not the object identity.
  $effect(() => toast.configure({ labels: { region: labels?.region, dismiss: labels?.dismiss } }));

  function bind(node: HTMLElement, id: string) {
    return { destroy: bindToast(node, id) };
  }
</script>

<svelte:document onkeydown={onToastKey} />

<div
  class="tst-viewport"
  role="region"
  aria-label={state.labels.region}
  data-position={state.position}
  data-theme={state.theme}
  onpointerenter={() => toast.pause()}
  onpointerleave={() => toast.resume()}
  onfocusin={(e) => (e.target as Element).matches(':focus-visible') && toast.pause()}
  onfocusout={() => toast.resume()}
>
  <div class="tst-sr" role="status">{state.status}</div>
  <div class="tst-sr" role="alert">{state.alert}</div>
  {#each state.toasts as t, idx (t.id)}
    {@const i = state.toasts.length - 1 - idx}
    <div class="tst-slot" style:--tst-i={i} use:bind={t.id}>
      <!-- Announced through the viewport's persistent live regions, not here. -->
      <div
        class="tst"
        data-phase={t.phase}
        data-type={t.type}
        style:--tst-life="{t.duration}ms"
      >
        {#if (t.action || t.secondary) && t.duration > 0}{#key t.duration}<div class="tst-timer"></div>{/key}{/if}
        {#if t.progress !== undefined}<div class="tst-progress" style:--pg={t.progress}></div>{/if}
        <div class="tst-icon">
          {#if t.image}
            <img class="tst-media" src={t.image} alt="" />
          {:else}
            <div class="tst-badge">
              <svg class="tst-svg" viewBox="0 0 24 24" aria-hidden="true">
                {#each ICONS[t.type] as d (d)}
                  <path {d} pathLength="1" />
                {/each}
              </svg>
            </div>
          {/if}
        </div>
        <div class="tst-body">
          <div class="tst-copy">
            <div class="tst-title">{t.title}{#if t.count > 1}<span class="tst-count">×{t.count}</span>{/if}{#if t.meta}<span class="tst-meta">{t.meta}</span>{/if}</div>
            {#if t.description}<div class="tst-desc">{t.description}</div>{/if}
          </div>
          {#if t.secondary}
            <button type="button" class="tst-action tst-secondary" tabindex={t.phase === 'open' ? 0 : -1} onclick={() => toast.act(t.id, 'secondary')}>{t.secondary.label}</button>
          {/if}
          {#if t.action}
            <button
              type="button"
              class="tst-action"
              tabindex={t.phase === 'open' ? 0 : -1}
              onclick={() => {
                toast.act(t.id);
              }}
            >
              {t.action.label}
            </button>
          {/if}
          {#if t.duration === 0 && t.type !== 'loading' && !t.secondary}
            <button type="button" class="tst-close" aria-label={state.labels.dismiss} tabindex={t.phase === 'open' ? 0 : -1} onclick={() => toast.dismiss(t.id)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          {/if}
        </div>
      </div>
    </div>
  {/each}
</div>
