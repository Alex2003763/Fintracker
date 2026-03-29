import{f as v,j as e,b as y}from"./index-BNwxRwFg.js";import{r as x}from"./charts-pPQeM_Kj.js";import{C as j}from"./CategoryIcon-TfdwQ76S.js";const k=({transaction:r,onEdit:l,onClick:n,user:o,style:g,variant:b="default"})=>{const s=r.type==="income",a=b==="compact",p=r.emoji??(()=>{if(!(o!=null&&o.customCategories))return;const t={...o.customCategories.expense,...o.customCategories.income};for(const h in t){const d=t[h].find(f=>f.name===r.category);if(d)return d.icon}})(),c=x.useCallback(t=>{n?n(r):l&&l(r)},[n,l,r]),u=x.useCallback(t=>{(t.key==="Enter"||t.key===" ")&&(t.preventDefault(),c(t))},[c]),i=new Date(r.date).toLocaleDateString("en-US",{month:"short",day:"numeric"}),m=`${s?"+":""}${v(r.amount)}`;return e.jsxs("div",{style:g,className:`
        w-full flex items-center gap-3 rounded-2xl cursor-pointer select-none
        transition-all duration-150 group touch-manipulation
        active:scale-[0.98] active:bg-[rgb(var(--color-card-muted-rgb))]
        hover:bg-[rgb(var(--color-card-muted-rgb))]/60
        ${a?"px-2.5 py-2":"px-4 py-3.5 border border-transparent hover:border-[rgb(var(--color-border-rgb))]/40 hover:shadow-sm"}
      `,onClick:c,onKeyDown:u,role:"button",tabIndex:0,"aria-label":`${r.description}, ${m}, ${r.category}, ${i}`,children:[e.jsx("div",{className:`
        flex-shrink-0 flex items-center justify-center rounded-[14px]
        transition-transform duration-200 group-hover:scale-105 group-active:scale-95
        ${a?"w-9 h-9":"w-11 h-11"}
        ${s?"bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400":"bg-[rgb(var(--color-border-rgb))]/40 text-[rgb(var(--color-text-rgb))]"}
      `,children:e.jsx(j,{category:r.category,emoji:p,className:`
            ${a?"h-4.5 w-4.5":"h-5 w-5"}
            ${s?"drop-shadow-sm":"opacity-75"}
          `})}),e.jsxs("div",{className:"flex-1 min-w-0",children:[e.jsxs("div",{className:"flex items-center justify-between gap-2",children:[e.jsx("p",{className:`
            font-semibold text-[rgb(var(--color-text-rgb))] truncate leading-tight
            ${a?"text-sm":"text-[14.5px]"}
          `,children:r.description}),e.jsx("p",{className:`
            font-bold tabular-nums whitespace-nowrap flex-shrink-0
            text-sm
            ${s?"text-emerald-600 dark:text-emerald-400":"text-[rgb(var(--color-text-rgb))]"}
          `,children:m})]}),e.jsxs("div",{className:"flex items-center justify-between gap-2 mt-0.5",children:[e.jsxs("div",{className:"flex items-center gap-1.5 min-w-0",children:[e.jsx("span",{className:`
              w-1.5 h-1.5 rounded-full flex-shrink-0
              ${s?"bg-emerald-500":"bg-[rgb(var(--color-primary-rgb))]"}
            `}),e.jsx("p",{className:"text-xs text-[rgb(var(--color-text-muted-rgb))] truncate font-medium",children:r.category})]}),e.jsx("span",{className:"text-xs text-[rgb(var(--color-text-muted-rgb))] opacity-60 tabular-nums flex-shrink-0",children:i})]})]}),!a&&e.jsx("div",{className:`\r
          flex-shrink-0 ml-1\r
          opacity-0 group-hover:opacity-100\r
          translate-x-2 group-hover:translate-x-0\r
          transition-all duration-200\r
        `,children:e.jsx(y,{className:"w-4 h-4 text-[rgb(var(--color-primary-rgb))]/70"})})]})};export{k as T};
