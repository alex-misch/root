

const routes = [
  {
    url: '/',
    template: `
      <lifestyle-index>
        <h1>Lifestyle index page</h1>
      </lifestyle-index>
    `,
  },
  {
    url: '/benefits/',
    template: `
      <benefit_list><h1>Benefits list</h1></benefit_list>
    `
  },
  {
    url: '/benefits/:slug{carhopper|lotte-plaza}/',
    template: `
      <benefit_list>
        <h1>Benefit carhopper or lotte-plaza</h1>
      </benefit_list>
    `
  },
  {
    url: '/benefits/:slug/',
    template: `
      <benefit_list>
        <h1>Benefit detail page</h1>
      </benefit_list>
    `
  },
  {
		url: '/benefits/:slug/:action/',
		tagName: 'benefits-list',
		entrypoint: 'benefits-list.js'
    // template: `
    //   <benefit_list>
    //     <h1>Share benefit</h1>
    //   </benefit_list>
    // `
  }
]

const viewTag = 'bmp-view'
const not_found_template = '<h1>Not found</h1>'
export { routes, viewTag, not_found_template }
