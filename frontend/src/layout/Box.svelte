<div class="box {classes}" ...props>
  <slot></slot>
</div>

<script>
  let { class: classes, $$slots: _0, $$scope: _1, ...props } = $$props
</script>

<style>
.box {
  padding: var(--s1);
  border: var(--border-thin) solid;
  --color-light: #fff;
  --color-dark: #000;
  color: var(--color-light);
  background-color: var(--color-dark);
}

.box :global(*) {
  color: inherit;
}

:global(.invert) .box {
  color: var(--color-dark);
  background-color: var(--color-light);
}
  
</style>