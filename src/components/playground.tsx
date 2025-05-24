import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';

export default function Playground({ starterCode, tests }: { starterCode: string; tests: any[] }) {
    const [Editor, setEditor] = useState<any>(null);
    const editorRef = useRef<any>(null);
    const vimRef = useRef<any>(null);
    const vimStatusBarRef = useRef<HTMLDivElement>(null);
    const [vimMode, setVimMode] = useState(false);
    const [output, setOutput] = useState<string | null>(null);
    const theme = useTheme();

    function getFunctionName(code: string) {
        const match = code.match(/function\s+([a-zA-Z0-9_]+)/);
        return match?.[1] || 'unknown';
    }

    async function runTests() {
        const code = editorRef.current?.getValue() || '';
        let results: string[] = [];
        try {
            const fn = new Function(`${code}; return ${getFunctionName(code)};`)();
            for (const { input, expected } of tests) {
                const actual = fn(...input);
                results.push(
                    actual === expected
                        ? `✅ Passed: input(${input}) → ${actual}`
                        : `❌ Failed: input(${input}) → ${actual}, expected ${expected}`
                );
            }
        } catch (e: any) {
            results = [`❌ Error: ${e.message}`];
        }
        setOutput(results.join('\n'));
    }

    useEffect(() => {
        import('@monaco-editor/react').then((mod) => {
            setEditor(() => mod.default);
        });
    }, []);

    useEffect(() => {
        let isMounted = true;
        const toggleVimMode = async () => {
            if (!editorRef.current || !vimStatusBarRef.current) return;

            if (vimMode) {
                const mod = await import('monaco-vim');
                if (!isMounted) return;
                vimRef.current = mod.initVimMode(editorRef.current, vimStatusBarRef.current);
            } else {
                vimRef.current?.dispose?.();
                vimRef.current = null;
                vimStatusBarRef.current.innerHTML = '';
            }
        };

        toggleVimMode();

        return () => {
            isMounted = false;
            vimRef.current?.dispose?.();
            vimRef.current = null;
        };
    }, [vimMode]);

    return (
        <div className="playground bg-[#fffffe] dark:bg-[#1E1E1E] border-2">
            {Editor && (
                <Editor
                    height="300px"
                    defaultLanguage="javascript"
                    defaultValue={starterCode}
                    theme={theme === "dark" ? "vs-dark" : "light"}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 16,
                    }}
                    onMount={(editor: any) => {
                        editorRef.current = editor;
                    }}
                />
            )}
            
            <div ref={vimStatusBarRef} className="mx-2 text-xs text-gray-600" />

            <hr className="!m-1"/>

            <div className="flex justify-center items-center gap-2 mt-2 mb-2">
                <button
                    onClick={runTests}
                    className="bg-[#ab4b08] hover:bg-[#8a3c06] text-white px-3 pt-1 rounded transition-colors"
                >▶</button>

                <button
                    onClick={() => setVimMode((v) => !v)}
                    className={`px-2 rounded-full transition-colors ${vimMode ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-300 hover:bg-gray-400'}`}
                    title="Toggle Vim Mode"
                >
                    <img src="/assets/Vim.png" alt="Vim" className="w-8 h-8 border-none inline" />
                </button>
            </div>

            {output && (
                <pre className="mx-4 bg-black text-white text-sm overflow-auto">
                    {output}
                </pre>
            )}
        </div>
    );
}
