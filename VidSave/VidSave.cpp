#include "stdafx.h"

#using <System.dll>

using namespace System;
using namespace System::ComponentModel;
using namespace System::Diagnostics;
using namespace System::Net;

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

int _tmain () {
	double procTimeBefore=getFlashProcTime(), procTime=0;

	do {
		procTime=getFlashProcTime();
		if ( (procTime-procTimeBefore) > CHECK_FREQUENCY*RUNNING_RATIO ) {
			printf("I think flash video is running!\n");
		} else {
			printf("I think flash video is NOT running!\n");
		}
		procTimeBefore=procTime;
		Sleep(CHECK_FREQUENCY*1000);
		
		if (_kbhit() && 'q'==_getch()) return 0;
	} while (true);
}
