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

#define CHECK_FREQUENCY 10 // seconds
#define RUNNING_RATIO 0.25

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
	bool *pvParam;

	if (!SystemParametersInfo(SPI_GETSCREENSAVEACTIVE, 0, &pvParam, 0)) {
		printf("Error getting state: %s\n", GetLastError());
	}
	printf("screen saver appears to be: %s\n", pvParam);

	printf("setting screen saver to: %d\n", on);
	if (!SystemParametersInfo(
			SPI_SETSCREENSAVEACTIVE, FALSE, (PVOID)on, SPIF_SENDWININICHANGE
		)
	) {
		printf("Error setting state: %s\n", GetLastError());
	}
}

int _tmain () {
	double procTimeBefore=getFlashProcTime(), procTime=0;

	do {
		procTime=getFlashProcTime();
		if ( (procTime-procTimeBefore) > CHECK_FREQUENCY*RUNNING_RATIO ) {
			toggleScreensaver(0);
		} else {
			toggleScreensaver(1);
		}
		procTimeBefore=procTime;
		Sleep(CHECK_FREQUENCY*1000);
		
		if (_kbhit() && 'q'==_getch()) return 0;
	} while (true);
}
