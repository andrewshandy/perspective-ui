import { useEffect, useRef } from 'react';

import '@finos/perspective-viewer';
import '@finos/perspective-viewer-datagrid'; // Include the datagrid plugin
import '@finos/perspective-viewer-d3fc'; // Include charting plugins
import "@finos/perspective-viewer/dist/css/pro-dark.css";
import perspective from "@finos/perspective";

import { HTMLPerspectiveViewerElement } from '@finos/perspective-viewer';

const worker = perspective.worker();

interface ArrowPerspectiveViewerProps {
    isLive: boolean;
    dataUrl?: string;
}

export function ArrowPerspectiveViewer({ isLive, dataUrl = 'http://localhost:8000/data' }: ArrowPerspectiveViewerProps) {
    const viewerRef = useRef<HTMLPerspectiveViewerElement>(document.createElement("perspective-viewer"));
    const wsRef = useRef<WebSocket | null>(null);
    const tableRef = useRef<any>(null);

    const processData = async (data: ArrayBuffer | string) => {
        const newTable = await worker.table(data);
        await viewerRef.current.load(newTable);
        
        if (tableRef.current) {
            tableRef.current.delete();
        }
        tableRef.current = newTable;
    };

    useEffect(() => {
        if (isLive) {
            const connectWebSocket = async () => {
                wsRef.current = new WebSocket('ws://0.0.0.0:8000/ws');
                
                wsRef.current.onopen = () => {
                    console.log('WebSocket Connected');
                };

                wsRef.current.onmessage = async (event) => {
                    try {
                        // const contentType = 'application/arrow'
                        const data = await event.data.arrayBuffer()
                        await processData(data);
                    } catch (error) {
                        console.error('Error processing WebSocket data:', error);
                    }
                };

                wsRef.current.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };

                wsRef.current.onclose = () => {
                    console.log('WebSocket connection closed');
                    setTimeout(connectWebSocket, 3000);
                };
            };

            connectWebSocket();

            return () => {
                if (wsRef.current) {
                    wsRef.current.close();
                }
            };
        } else {
            // One-time HTTP request
            const fetchData = async () => {
                try {
                    const response = await fetch(dataUrl);
                    const contentType = response.headers.get('content-type') || '';
                    let data;
                    
                    if (contentType.includes('application/vnd.apache.arrow.file')) {
                        data = await response.arrayBuffer();
                    } else {
                        data = JSON.parse(await response.text());
                    }
                    
                    await processData(data);
                } catch (error) {
                    console.error('Error fetching data:', error);
                }
            };

            fetchData();
        }

        // Cleanup function
        return () => {
            if (tableRef.current) {
                tableRef.current.delete();
            }
        };
    }, [isLive, dataUrl]);

    return (
        <perspective-viewer
            ref={viewerRef}
            style={{
                width: '100vw',
                height: '100vh',
                minWidth: '300px',
                minHeight: '300px',
            }}
        ></perspective-viewer>
    );
}