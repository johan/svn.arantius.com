#pragma once
#define WIN32_LEAN_AND_MEAN
#include <stdio.h>
#include <tchar.h>
#include <windows.h>
#include <psapi.h>
#include <conio.h>

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
		for (unsigned int i=0; i<cbNeeded/sizeof(HMODULE); i++) {
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

	for (unsigned int i=0; i<cProcesses; i++) {
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

void toggleScreensaver(bool on) {
	printf("setting screen saver to: %d\n", on);
	if (!SystemParametersInfo(
			SPI_SETSCREENSAVEACTIVE, on, 0, SPIF_SENDWININICHANGE
		)
	) {
		printf("Error setting state: %s\n", GetLastError());
	}
}

void suspendScreensaver() {
	UINT ssActive=0;
	if (SystemParametersInfo(SPI_GETSCREENSAVEACTIVE, 0, (PVOID)&ssActive, 0)) {
		printf("Suspending SS!\n");
		//SystemParametersInfo(SPI_SETSCREENSAVEACTIVE, 0, 0, SPIF_SENDCHANGE);
		SystemParametersInfo(SPI_SETSCREENSAVEACTIVE, ssActive, 0, SPIF_SENDCHANGE);
	}
}

bool rectEquals(RECT rect1, RECT rect2) {
	return rect1.top==rect2.top &&
		rect1.right==rect2.right &&
		rect1.left==rect2.left &&
		rect1.bottom==rect2.bottom;
}

int _tmain () {
	double procTimeBefore=0, procTime=0;
	HWND foreWin, deskWin;
	RECT foreRect, deskRect;

	if (deskWin=GetDesktopWindow()) {
		if (!GetWindowRect(deskWin, &deskRect)) {
			MessageBox(
				NULL,
				_T("Error finding desktop size!"),
				_T("Flavisa Error"),
				MB_ICONEXCLAMATION
			);
			return 1;
		}
	} else {
		MessageBox(
			NULL,
			_T("Error finding desktop window!"),
			_T("Flavisa Error"),
			MB_ICONEXCLAMATION
		);
		return 1;
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
