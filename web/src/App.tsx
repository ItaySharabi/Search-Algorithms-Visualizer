import { useEffect, useMemo, useState } from 'react';
import type { AlgoName } from '@algo/api/search-event.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BoardPanel } from '@/components/BoardPanel';
import { PathTreePanel } from '@/components/PathTreePanel';
import { FrontierPanel } from '@/components/FrontierPanel';
import { ExploredPanel } from '@/components/ExploredPanel';
import { StatsPanel } from '@/components/StatsPanel';
import { Timeline } from '@/components/Timeline';
import { PresetSelect } from '@/components/PresetSelect';
import { AlgorithmSelect } from '@/components/AlgorithmSelect';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShareButton } from '@/components/ShareButton';
import { PuzzlePasteBox } from '@/components/PuzzlePasteBox';
import { ComparisonTable } from '@/components/ComparisonTable';
import { SearchGraphPanel } from '@/components/SearchGraphPanel';
import { useWorkerRun } from '@/hooks/useWorkerRun';
import { useUrlState, readInitialUrlState } from '@/hooks/useUrlState';
import { useTraceStore } from '@/store/trace-store';
import { PRESETS } from '@/presets';

type Tab = 'viewer' | 'graph' | 'compare';

export function App(): JSX.Element {
  const initial = useMemo(() => readInitialUrlState(), []);
  const [presetName, setPresetName] = useState<string>(initial.preset ?? PRESETS[0]!.name);
  const [algo, setAlgo] = useState<AlgoName>(initial.algo ?? 'A*');
  const [customText, setCustomText] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('viewer');

  const { run, cancel } = useWorkerRun();
  const meta = useTraceStore(s => s.meta);
  const stepIndex = useTraceStore(s => s.currentStepIndex);
  const eventsLen = useTraceStore(s => s.events.length);

  useUrlState({ preset: presetName, algo, step: meta.status === 'complete' ? stepIndex : null });

  const preset = useMemo(
    () => PRESETS.find(p => p.name === presetName) ?? PRESETS[0]!,
    [presetName],
  );

  const inputText = customText ?? preset.text;

  // Apply initial step from URL once events arrive (if URL had a step).
  useEffect(() => {
    if (initial.step !== null && eventsLen > 0 && meta.status === 'complete') {
      useTraceStore.getState().setStepIndex(initial.step);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventsLen, meta.status]);

  return (
    <div className='min-h-screen bg-background text-foreground'>
      <header className='flex items-center justify-between border-b px-6 py-3'>
        <div className='flex items-center gap-3'>
          <h1 className='text-xl font-semibold'>Search Algorithms Visualizer</h1>
          <span className='text-xs text-muted-foreground'>marbles puzzle</span>
        </div>
        <div className='flex items-center gap-2'>
          <div className='flex rounded-md border p-0.5 text-xs'>
            <button
              onClick={() => setTab('viewer')}
              className={`px-3 py-1 rounded ${tab === 'viewer' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Viewer
            </button>
            <button
              onClick={() => setTab('graph')}
              className={`px-3 py-1 rounded ${tab === 'graph' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Graph
            </button>
            <button
              onClick={() => setTab('compare')}
              className={`px-3 py-1 rounded ${tab === 'compare' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
            >
              Compare
            </button>
          </div>
          <ShareButton />
          <ThemeToggle />
        </div>
      </header>

      <div className='grid gap-4 p-6 lg:grid-cols-[320px_1fr]'>
        <aside className='space-y-3'>
          <Card>
            <CardHeader>
              <CardTitle>Run</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='space-y-1'>
                <label className='text-xs text-muted-foreground'>
                  {customText !== null ? 'Custom puzzle (active)' : 'Preset'}
                </label>
                <div className='flex gap-2'>
                  <PresetSelect
                    value={presetName}
                    onChange={n => {
                      setPresetName(n);
                      setCustomText(null);
                    }}
                  />
                  {customText !== null && (
                    <Button size='sm' variant='outline' onClick={() => setCustomText(null)}>
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <div className='space-y-1'>
                <label className='text-xs text-muted-foreground'>Algorithm</label>
                <AlgorithmSelect value={algo} onChange={setAlgo} />
              </div>
              <div className='flex gap-2'>
                <Button
                  className='flex-1'
                  onClick={() => run(algo, inputText)}
                  disabled={meta.status === 'running'}
                >
                  {meta.status === 'running' ? 'Running…' : 'Run'}
                </Button>
                <Button variant='outline' onClick={cancel} disabled={meta.status !== 'running'}>
                  Cancel
                </Button>
              </div>
              {meta.error !== null && <div className='text-xs text-destructive'>{meta.error}</div>}
              {meta.finalString !== null && (
                <pre className='overflow-x-auto rounded border bg-muted p-2 text-[10px] leading-tight'>
                  {meta.finalString}
                </pre>
              )}
            </CardContent>
          </Card>

          <PuzzlePasteBox
            onUse={text => {
              setCustomText(text);
            }}
          />
        </aside>

        <main className='space-y-3'>
          {tab === 'viewer' && (
            <>
              <div className='grid gap-3 md:grid-cols-3'>
                <BoardPanel />
                <PathTreePanel />
                <StatsPanel />
                <FrontierPanel />
                <ExploredPanel />
              </div>
              <Timeline />
            </>
          )}
          {tab === 'graph' && (
            <>
              <SearchGraphPanel />
              <Timeline />
            </>
          )}
          {tab === 'compare' && <ComparisonTable inputText={inputText} />}
        </main>
      </div>
    </div>
  );
}
