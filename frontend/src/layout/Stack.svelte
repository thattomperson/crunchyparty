<div class="stack {classes}" {...props}>
  <slot></slot>
</div>
  
<script>

let { class: classes, $$slots: _0, $$scope: _1, ...props } = $$props
console.log(classes, props)

</script>

<style>
.stack {
  --space: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}

.stack > :global(*) {
  margin-top: 0;
  margin-bottom: 0;
} 

.stack > :global(* + *) {
  margin-top: var(--space);
}
</style>

