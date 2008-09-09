#pragma once
#define WIN32_LEAN_AND_MEAN
#include <stdio.h>
#include <tchar.h>
#include <windows.h>
#include <psapi.h>
#include <conio.h>
#include <strsafe.h>

#using <System.dll>
using namespace System;
using namespace System::ComponentModel;
using namespace System::Diagnostics;

#define CHECK_FREQUENCY 2 // seconds
#define IDLE_RATIO 0.25

bool ScanModules( DWORD processID )
{
	HMODULE hMods[1024];
	HANDLE hProcess;
	DWORD cbNeeded;

	// Get a list of all the modules in this process.
	hProcess=OpenProcess(
		PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, processID
	);
	if (NULL==hProcess) return 0;

	if (EnumProcessModules(hProcess, hMods, sizeof(hMods), &cbNeeded)) {
		for (unsigned int i=0; i<cbNeeded/sizeof(HMODULE) && i<1024; i++) {
			TCHAR szModName[MAX_PATH];

			if (GetModuleBaseName(
				hProcess, hMods[i], szModName, sizeof(szModName)/sizeof(TCHAR)
			)) {
				if (0==_wcsicmp(szModName, _T("npswf32.dll"))) {
					CloseHandle(hProcess);
					return 1;
				}
			}
		}
	}

	CloseHandle(hProcess);
	return 0;
}

DWORD FindFlash() {
	DWORD aProcesses[1024], cbNeeded;

	// Get the list of process identifiers.
	if (!EnumProcesses(aProcesses, sizeof(aProcesses), &cbNeeded)) {
		return 0;
	}

	// Calculate how many process identifiers were returned.
	DWORD cProcesses=cbNeeded/sizeof(DWORD);

	for (unsigned int i=0; i<cProcesses && i<1024; i++) {
		if (ScanModules(aProcesses[i])) return aProcesses[i];
	}

	return 0;
}

double getFlashProcTime() {
	DWORD processId=0;
	processId=FindFlash();
	if (!processId) return 0;

	Process^ process=Process::GetProcessById(processId);
	return process->TotalProcessorTime.TotalSeconds;
}

void suspendScreensaver() {
	UINT ssActive=0;
	if (SystemParametersInfo(SPI_GETSCREENSAVEACTIVE, 0, (PVOID)&ssActive, 0)) {
		SystemParametersInfo(SPI_SETSCREENSAVEACTIVE, ssActive, 0, SPIF_SENDCHANGE);
	}
}

bool rectEquals(RECT rect1, RECT rect2) {
	return rect1.top==rect2.top &&
		rect1.right==rect2.right &&
		rect1.left==rect2.left &&
		rect1.bottom==rect2.bottom;
}

// http://msdn.microsoft.com/en-us/library/ms680582(VS.85).aspx
void ErrorExit(LPTSTR lpszFunction) { 
	// Retrieve the system error message for the last-error code
	LPVOID lpMsgBuf;
	LPVOID lpDisplayBuf;
	DWORD dw = GetLastError(); 

	FormatMessage(
		FORMAT_MESSAGE_ALLOCATE_BUFFER | 
		FORMAT_MESSAGE_FROM_SYSTEM |
		FORMAT_MESSAGE_IGNORE_INSERTS,
		NULL,
		dw,
		MAKELANGID(LANG_NEUTRAL, SUBLANG_DEFAULT),
		(LPTSTR) &lpMsgBuf,
		0, NULL
	);

	// Display the error message and exit the process
	lpDisplayBuf = (LPVOID)LocalAlloc(LMEM_ZEROINIT, 
		(lstrlen((LPCTSTR)lpMsgBuf)+lstrlen((LPCTSTR)lpszFunction)+40)*sizeof(TCHAR)); 
	StringCchPrintf((LPTSTR)lpDisplayBuf, 
		LocalSize(lpDisplayBuf) / sizeof(TCHAR),
		TEXT("%s failed with error %d: %s"), 
		lpszFunction, dw, lpMsgBuf
	);
	MessageBox(NULL, (LPCTSTR)lpDisplayBuf, TEXT("Error"), MB_OK); 

	LocalFree(lpMsgBuf);
	LocalFree(lpDisplayBuf);
	ExitProcess(dw); 
}

int _tmain () {
	double procTimeBefore=0, procTime=0;
	HWND foreWin, deskWin, myWin;
	RECT foreRect, deskRect;

	// Set up this window.
	if (!(myWin=GetWindow(NULL, NULL))) {
		ErrorExit(_T("GetWindow"));
	}

	// Look up the size of the desktop.
	if (deskWin=GetDesktopWindow()) {
		if (!GetWindowRect(deskWin, &deskRect)) {
			ErrorExit(_T("GetWindowRect"));
		}
	} else {
		ErrorExit(_T("GetDesktopWindow"));
	}

	do {
		// Quit when the user says to.
		if (_kbhit() && 'q'==_getch()) return 0;

		// Wait for next time.
		Sleep(CHECK_FREQUENCY*1000);

		// Wait again if the processor has been idle.
		procTimeBefore=procTime;
		procTime=getFlashProcTime();
		if ( (procTime-procTimeBefore) < CHECK_FREQUENCY*IDLE_RATIO ) {
			continue;
		}

		// Wait again if flash (or something...) isn't full screen.
		if (foreWin=GetForegroundWindow()) {
			if (GetWindowRect(foreWin, &foreRect)) {
				if (!rectEquals(foreRect, deskRect)) continue;
			}
		}

		// We made it through all the tests, suspend the screen saver.
		suspendScreensaver();
	} while (true);
}
