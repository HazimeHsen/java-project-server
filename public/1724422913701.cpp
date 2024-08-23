assignment

#include<stdio.h>

int main () {
	int WTime[50],BTime[50],TATime[50],TWTime,TTTime,AWTime,ATTime;
	int n;
	do{
		printf("enter the nb of the process: ");
		scanf("%d",&n);
	}while(n>5);
	
	for(int i =0;i<n;i++) {
		printf("enter the BTime: ");
		scanf("%d",&BTime[i]);
		
		if(BTime[i] > 4000){
			printf("Error BTime must be less than 4000 ms");
			return 0;
		}
	}
	
	WTime[0] = 0;
	
	for(int i=1; i<n; i++) {
 		WTime[i] = WTime[i - 1] + BTime[i - 1];
 		TATime[i] = WTime[i] + BTime[i];
		TWTime = TWTime + WTime[i];
		TTTime = TTTime + TATime[i];
	}
	
	TTTime = TTTime + BTime[0]; 
	
	AWTime = (float)TWTime / n;
	ATTime = (float)ATTime / n;
	
	printf("Avarage waiting time: %d", AWTime);
	printf("\nAvarage Turn time: %d", ATTime);

	return 0;
}
