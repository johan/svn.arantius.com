#include "stdafx.h"

#using <System.dll>

using namespace System;
using namespace System::Diagnostics;
using namespace System::ComponentModel;


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

int _tmain () {
	DWORD processId=FindFlash();

	printf("Found flash? %s\n", processId?"Yes":"No");
	printf("Found flash? %d\n", processId);

	Process^ process = Process::GetProcessById(processId);

	for (int i=0; i<15; i++) {
		process->Refresh();

		//printf("Total time: %s\n", process->TotalProcessorTime);
		//Console::WriteLine( "  user processor time: {0}", process->UserProcessorTime );
		//Console::WriteLine( "  privileged processor time: {0}", process->PrivilegedProcessorTime );
		Console::WriteLine( "  total processor time: {0}", process->TotalProcessorTime );

		Sleep(500);
	}

	_getch();
}