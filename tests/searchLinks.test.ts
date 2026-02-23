import { describe, expect, it } from 'vitest';
import { createSearchUrl } from '@/lib/searchLinks';

describe('createSearchUrl', () => {
  it('builds encoded url', () => {
    const url = createSearchUrl('naver', ['오버핏', '후드집업']);
    expect(url).toContain('search.shopping.naver.com');
    expect(url).toContain(encodeURIComponent('오버핏 후드집업'));
  });
});
