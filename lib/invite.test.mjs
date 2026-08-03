/* Linki-zaproszenia (#6/2). Uruchom: node --test lib/invite.test.mjs */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encodeInvite, decodeInvite, inviteUrl, parseInviteFromSearch, isHandle } from './invite.js';

test('encode → decode odzyskuje pseudonim (round-trip, w tym Unicode)', () => {
  const ps = 'Spokojna Rzeka #C3D4';
  assert.equal(decodeInvite(encodeInvite(ps)), ps);
  const ps2 = 'Zażółć Gęślą #A1B2';
  assert.equal(decodeInvite(encodeInvite(ps2)), ps2);
});

test('token jest URL-bezpieczny (base64url, bez +/=)', () => {
  const tok = encodeInvite('Ciepły Ogród #FFEE');
  assert.match(tok, /^[A-Za-z0-9\-_]+$/);
});

test('inviteUrl buduje link ?k=… i parseInviteFromSearch go odczytuje', () => {
  const url = inviteUrl('https://krag.app/', 'Nocny Brzeg #12AB');
  assert.match(url, /^https:\/\/krag\.app\/\?k=[A-Za-z0-9\-_]+$/);
  const search = url.slice(url.indexOf('?'));
  assert.equal(parseInviteFromSearch(search), 'Nocny Brzeg #12AB');
});

test('odrzuca śmieci i nie-uchwyty', () => {
  assert.equal(decodeInvite('!!!niepoprawne!!!'), null);
  assert.equal(decodeInvite(encodeInvite('to nie jest uchwyt')), null); // brak #HASH
  assert.equal(parseInviteFromSearch('?x=1'), null);
  assert.equal(parseInviteFromSearch(''), null);
});

test('isHandle waliduje format pseudonimu', () => {
  assert.ok(isHandle('Jasny Świt #00FF'));
  assert.ok(!isHandle('bez hasha'));
  assert.ok(!isHandle('Zła #ZZZZ'));
});
