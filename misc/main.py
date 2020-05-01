import asyncio
import sys
from bleak import discover
from bleak import BleakClient
from pythonosc.udp_client import SimpleUDPClient

# BTLE devices and RX characteristic
UUID_R1 = "FAC33BFD-F38F-498D-A2EA-F83AAA340AA4"
RX_R1 = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
# UUID_R2 = "FAC33BFD-F38F-498D-A2EA-F83AAA340AA4"
# RX_R2 = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

# BTLE clients
client1 = None
client2 = None
# osc client
osc = SimpleUDPClient("127.0.0.1", 1337)
# main loop
loop = asyncio.get_event_loop()

def handleDataR1(sender, data):
    print("R1:", int(data))
    osc.send_message("/r1", int(data))

def handleDataR2(sender, data):
    print("R2:", int(data))
    osc.send_message("/r2", int(data))

async def devices():
    devices = await discover()
    for d in devices:
        print(d)

async def run(loop):
  await devices()
  # first device
  client1 = BleakClient(UUID_R1, loop=loop)
  await client1.connect()
  print("R1 connected")
  await client1.start_notify(RX_R1, handleDataR1)
  # second device
  # client2 = BleakClient(UUID_R2, loop=loop)
  # await client2.connect()
  # print("R2 connected")
  # await client2.start_notify(RX_R2, handleDataR2)

  while 1:
    res = await loop.run_in_executor(None, sys.stdin.readline)
    if res.strip() == 'q':
      print('quit')
      break
    await asyncio.sleep(0.5)
  await client1.stop_notify(RX_R1)
  await client1.disconnect()
  # await client2.stop_notify(RX_R2)
  # await client2.disconnect()

loop.run_until_complete(run(loop))
loop.close()