// 'use client'

// import { usePathname } from 'next/navigation'

// export default function LocaleSwitcher() {
//   const pathname = usePathname()

//   function switchLocale(locale: string) {
//     // e.g. '/en/about' or '/fr/contact'
//     const newPath = `/${locale}${pathname}`
//     window.history.replaceState(null, '', newPath)
//   }

//   return (
//     <>
//       <button onClick={() => switchLocale('en')}>English</button>
//       <button onClick={() => switchLocale('fr')}>French</button>
//     </>
//   )
// }

'use client'

import { useSearchParams } from 'next/navigation'

export default function SortProducts() {
  const searchParams = useSearchParams()

  function updateSorting(sortOrder: string) {
    const params = new URLSearchParams(searchParams?.toString() || '')
    params.set('sort', sortOrder)
    window.history.pushState(null, '', `?${params.toString()}`)
  }

  return (
    <>
      <button onClick={() => updateSorting('asc')}>Sort Ascending</button>
      <button onClick={() => updateSorting('desc')}>Sort Descending</button>
    </>
  )
}