
import fs from 'fs'
import { SitemapGenerator } from './bmp-sitemap/index.mjs'
import { urlConf, server_name } from './project/config.js-com-v5.mjs';

const sitemap = new SitemapGenerator( urlConf, server_name )
fs.writeFile( './sitemap.xml', sitemap.toXML(), (err) => {
  if (err) throw err;
  console.log('Sitemap was saved to "sitemap.xml"!');
})
