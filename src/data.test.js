import test from 'node:test';
import assert from 'node:assert/strict';
import { albums, filterAlbums } from './data.js';
test('sanatçı ve albüm adı ile arar',()=>{assert.equal(filterAlbums('pink floyd')[0].id,1);assert.equal(filterAlbums('rainbows')[0].id,5);});
test('Türkçe harfleri ve boşlukları işler',()=>{assert.equal(filterAlbums(' BARIŞ ')[0].id,3);});
test('tür ve arama birlikte çalışır',()=>{assert.equal(filterAlbums('Metallica','Metal').length,1);assert.equal(filterAlbums('Metallica','Rock').length,0);assert.equal(filterAlbums('','Rock').length,2);});
test('sonuç yok ve temiz filtre durumları',()=>{assert.equal(filterAlbums('bulunamayan').length,0);assert.equal(filterAlbums().length,albums.length);});
