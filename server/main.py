from fastapi import FastAPI, Response, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pyarrow as pa
import asyncio
import random
from datetime import datetime
import logging

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Your frontend URL
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    try:
        while True:
            # Generate new random data
            data = [{
                'timestamp': datetime.now(),
                'value': random.uniform(0, 100),
                'name': random.choice(['John', 'Jane', 'Bob']),
            } for _ in range(100)]
            
            # Convert to Arrow table
            table = pa.Table.from_pylist(data)
            # Serialize the table
            sink = pa.BufferOutputStream()
            with pa.ipc.new_stream(sink, table.schema) as writer:
                writer.write_table(table)
            # Send the serialized table
            await websocket.send_bytes(sink.getvalue().to_pybytes())
            
            # Wait for a few seconds before sending the next update
            await asyncio.sleep(2)
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await websocket.close()

@app.get("/data")
async def get_data():
    data = [{
        'timestamp': str(datetime.now()),
        'value': random.uniform(0, 100),
        'name': random.choice(['John', 'Jane', 'Bob']),
        'message': 'Regular HTTP endpoint'
    } for _ in range(100)]

    # table = pa.Table.from_pylist(data)
    # sink = pa.BufferOutputStream()
    # with pa.ipc.new_stream(sink, table.schema) as writer:
    #     writer.write_table(table)
    
    # return Response(
    #     content=sink.getvalue().to_pybytes(),
    #     media_type="application/vnd.apache.arrow.file"
    # )
    
    return JSONResponse(
        content=data,
        headers={
            "Content-Type": "application/json",
            # "X-Custom-Header": "json-data",
        }
    )