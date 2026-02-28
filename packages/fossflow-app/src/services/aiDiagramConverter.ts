/**
 * Converts AI-generated compact diagram schema into FossFLOW DiagramData format
 */

import { transformFromCompactFormat } from 'fossflow';
import { DiagramData } from '../diagramUtils';
import {
  AICompactDiagram,
  AICompactItem,
  AICompactView,
  AVAILABLE_ICON_IDS
} from './aiService';

const DEFAULT_COMPACT_META = { f: 'compact', v: '1.0' } as const;

const LEGACY_ICON_MAP: Record<string, string> = {
  person: 'user',
  web_app: 'desktop',
  webapp: 'desktop',
  api: 'server',
  load_balancer: 'loadbalancer',
  loadbalancer: 'loadbalancer',
  microservice: 'cube',
  redis: 'cache',
  authentication: 'lock',
  shield: 'firewall',
  gateway: 'router',
  bank: 'paymentcard',
  database: 'storage',
  notification: 'mail',
  monitoring: 'desktop',
  cdn: 'cloud',
  mobile: 'mobiledevice',
  backup: 'storage',
  analytics: 'diamond',
  logs: 'document'
};

const toSafeString = (value: unknown) => {
  if (typeof value === 'string') return value;
  if (value === null || value === undefined) return '';
  return String(value);
};

const buildIconIdSet = (existingIcons: any[]) => {
  const ids = new Set<string>(AVAILABLE_ICON_IDS);

  if (Array.isArray(existingIcons)) {
    for (const icon of existingIcons) {
      if (icon?.id) ids.add(String(icon.id));
    }
  }

  return ids;
};

const normalizeIconId = (iconId: string, iconIds: Set<string>) => {
  const raw = toSafeString(iconId).trim().toLowerCase();
  if (!raw) return 'block';
  if (iconIds.has(raw)) return raw;

  const normalizedKey = raw.replace(/[\s-]+/g, '_');
  const mapped = LEGACY_ICON_MAP[normalizedKey] || LEGACY_ICON_MAP[raw];
  if (mapped && iconIds.has(mapped)) return mapped;

  const hyphenCandidate = raw.replace(/_/g, '-');
  if (iconIds.has(hyphenCandidate)) return hyphenCandidate;

  const compactCandidate = raw.replace(/[-_\s]+/g, '');
  if (iconIds.has(compactCandidate)) return compactCandidate;

  return 'block';
};

const autoLayoutPositions = (
  itemCount: number,
  usedIndices: Set<number>
): AICompactView[0] => {
  const positions: AICompactView[0] = [];
  if (itemCount <= 0) return positions;

  const columns = Math.max(4, Math.ceil(Math.sqrt(itemCount)));
  const spacing = 4;
  let placed = 0;

  for (let index = 0; index < itemCount; index += 1) {
    if (usedIndices.has(index)) continue;
    const col = placed % columns;
    const row = Math.floor(placed / columns);
    positions.push([index, col * spacing, row * spacing]);
    placed += 1;
  }

  return positions;
};

const normalizeView = (
  view: unknown,
  itemCount: number,
  ensureAllItems: boolean
): AICompactView => {
  const rawView = Array.isArray(view) ? view : [];
  const rawPositions = Array.isArray(rawView[0]) ? rawView[0] : [];
  const rawConnections = Array.isArray(rawView[1]) ? rawView[1] : [];

  const positions: AICompactView[0] = [];
  const usedIndices = new Set<number>();

  for (const pos of rawPositions) {
    if (!Array.isArray(pos) || pos.length < 3) continue;
    const itemIndex = Number(pos[0]);
    const x = Number(pos[1]);
    const y = Number(pos[2]);
    if (!Number.isFinite(itemIndex) || !Number.isFinite(x) || !Number.isFinite(y)) {
      continue;
    }
    if (itemIndex < 0 || itemIndex >= itemCount || usedIndices.has(itemIndex)) {
      continue;
    }
    usedIndices.add(itemIndex);
    positions.push([itemIndex, Math.round(x), Math.round(y)]);
  }

  if (ensureAllItems) {
    const autoPositions = autoLayoutPositions(itemCount, usedIndices);
    positions.push(...autoPositions);
  }

  const connections: AICompactView[1] = [];
  for (const conn of rawConnections) {
    if (!Array.isArray(conn) || conn.length < 2) continue;
    const fromIndex = Number(conn[0]);
    const toIndex = Number(conn[1]);
    if (!Number.isFinite(fromIndex) || !Number.isFinite(toIndex)) continue;
    if (fromIndex < 0 || fromIndex >= itemCount) continue;
    if (toIndex < 0 || toIndex >= itemCount) continue;
    connections.push([fromIndex, toIndex]);
  }

  return [positions, connections];
};

const normalizeCompactDiagram = (
  diagram: AICompactDiagram,
  existingIcons: any[]
): AICompactDiagram => {
  const iconIds = buildIconIdSet(existingIcons);

  const title = toSafeString(diagram?.t).trim() || 'Untitled';
  const rawItems = Array.isArray(diagram?.i) ? diagram.i : [];

  const items: AICompactItem[] = rawItems.map((item, index) => {
    const rawItem = Array.isArray(item) ? item : [];
    const name = toSafeString(rawItem[0]).trim() || `Item ${index + 1}`;
    const icon = normalizeIconId(toSafeString(rawItem[1]), iconIds);
    const description = toSafeString(rawItem[2]);
    return [name, icon, description];
  });

  const rawViews = Array.isArray(diagram?.v) ? diagram.v : [];
  const views = (rawViews.length ? rawViews : [[]]).map((view, index) => {
    return normalizeView(view, items.length, index === 0);
  });

  return {
    t: title,
    i: items,
    v: views,
    _: DEFAULT_COMPACT_META
  };
};

/**
 * Convert AI-generated compact diagram to FossFLOW DiagramData format
 */
export function convertAIDiagramToFossFLOW(
  aiDiagram: AICompactDiagram,
  existingIcons: any[]
): DiagramData {
  const normalized = normalizeCompactDiagram(aiDiagram, existingIcons);
  const model = transformFromCompactFormat(normalized);

  return {
    ...model,
    title: normalized.t,
    fitToScreen: true
  };
}

/**
 * Generate a preview summary of the AI diagram
 */
export function generateDiagramSummary(diagram: AICompactDiagram): string {
  const lines: string[] = [];
  const title = toSafeString(diagram?.t).trim() || 'Untitled';

  lines.push(`📊 ${title}`);

  const items = Array.isArray(diagram?.i) ? diagram.i : [];
  lines.push('');
  lines.push(`🔲 ${items.length} item(s):`);
  items.forEach((item, index) => {
    if (!Array.isArray(item)) return;
    const name = toSafeString(item[0]).trim() || `Item ${index + 1}`;
    const icon = toSafeString(item[1]).trim() || 'block';
    lines.push(`  • ${name} (${icon})`);
  });

  const firstView = Array.isArray(diagram?.v) && diagram.v.length > 0 ? diagram.v[0] : null;
  const connections = firstView && Array.isArray(firstView[1]) ? firstView[1] : [];

  lines.push('');
  lines.push(`🔗 ${connections.length} connector(s):`);
  connections.forEach((conn) => {
    if (!Array.isArray(conn) || conn.length < 2) return;
    const fromIndex = Number(conn[0]);
    const toIndex = Number(conn[1]);
    const fromItem = items[fromIndex];
    const toItem = items[toIndex];
    const fromName = Array.isArray(fromItem) ? toSafeString(fromItem[0]).trim() : `Item ${fromIndex + 1}`;
    const toName = Array.isArray(toItem) ? toSafeString(toItem[0]).trim() : `Item ${toIndex + 1}`;
    lines.push(`  • ${fromName} → ${toName}`);
  });

  return lines.join('\n');
}
