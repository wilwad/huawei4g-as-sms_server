function human(){
 		 this.name = 'William';
		 this.surname = 'Sengdara';
		 this.dob = '21 December 1981';
		 this.sex = 'M';

		 this.get_name = function(){return this.name;}
}

module.exports = human()
