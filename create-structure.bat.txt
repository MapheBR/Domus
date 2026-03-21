@echo off

mkdir domus-app
cd domus-app

type nul > App.js

mkdir src\config
type nul > src\config\firebase.js

mkdir src\contexts
type nul > src\contexts\AuthContext.js

mkdir src\theme
type nul > src\theme\colors.js

mkdir src\components
type nul > src\components\Header.js
type nul > src\components\Button.js
type nul > src\components\Card.js
type nul > src\components\Input.js
type nul > src\components\StatusBadge.js

mkdir src\screens\auth
type nul > src\screens\auth\WelcomeScreen.js
type nul > src\screens\auth\LoginScreen.js
type nul > src\screens\auth\RegisterScreen.js

mkdir src\screens\main
type nul > src\screens\main\HomeScreen.js
type nul > src\screens\main\CheckInScreen.js
type nul > src\screens\main\RecordsScreen.js
type nul > src\screens\main\EmployeesScreen.js
type nul > src\screens\main\AddEmployeeScreen.js
type nul > src\screens\main\ReportsScreen.js
type nul > src\screens\main\ContractScreen.js
type nul > src\screens\main\CalculatorScreen.js
type nul > src\screens\main\PlansScreen.js
type nul > src\screens\main\ProfileScreen.js

mkdir src\navigation
type nul > src\navigation\AuthNavigator.js
type nul > src\navigation\MainNavigator.js
type nul > src\navigation\AppNavigator.js

mkdir src\utils
type nul > src\utils\laborCalcs.js
type nul > src\utils\hashUtils.js
type nul > src\utils\pdfGenerator.js

echo Estrutura criada com sucesso!
pause