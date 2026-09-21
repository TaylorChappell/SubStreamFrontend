export const CATEGORIES = [
  { id: 'community', name: 'Community', label: 'Just chatting', word: 'Stay\nconnected.', detail: 'Catch up with your coin’s community.', short: 'Conversations & updates', code: '01' },
  { id: 'development', name: 'Development', label: 'Building live', word: 'Watch it\nhappen.', detail: 'Development, product demos and work in progress.', short: 'Code & product demos', code: '02' },
  { id: 'ama', name: 'AMA', label: 'Ask the team', word: 'Good\nquestions.', detail: 'Go straight to the people behind the project.', short: 'Questions & answers', code: '03' },
  { id: 'gaming', name: 'Gaming', label: 'Game on', word: 'One more\nround.', detail: 'Play, compete and hang out together.', short: 'Games & multiplayer', code: '04' },
  { id: 'art', name: 'Art', label: 'Making things', word: 'Make\nsomething.', detail: 'Art, design and the creative process.', short: 'Art & design', code: '05' },
  { id: 'education', name: 'Education', label: 'Learn together', word: 'A little\nwiser.', detail: 'Walkthroughs, explainers and shared knowledge.', short: 'Lessons & walkthroughs', code: '06' },
] as const;
export function categoryById(id?: string) { return CATEGORIES.find(item => item.id === id); }
export function categoryLabel(name: string) { return CATEGORIES.find(item => item.name === name)?.label ?? name; }
export function relativeTime(time?: number | null) {
  if (!time) return 'No broadcasts yet';
  const mins = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  if (mins < 10080) return `${Math.floor(mins / 1440)}d ago`;
  return new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric', year: new Date(time).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}
