//SPDX-Licese-Identifier:MIT
pragma solidity ^0.8.17;
error Error__LowBalance();
error Error__NullAddress();

contract Token {
    //State Variables
    string public s_name;
    string public s_symbol;
    uint256 public constant DECIMAL = 18;
    uint256 public s_totalSupply;

    //Mapping
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    //Events
    event Token__Transfer(
        address indexed sender,
        address indexed receiver,
        uint256 value,
        uint256 balance
    );
    event Token__Approve(
        address indexed owner,
        address indexed spender,
        uint256 value
    );

    //Constructor
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _totalSupply
    ) {
        s_name = _name;
        s_symbol = _symbol;
        s_totalSupply = _totalSupply * (10 ** DECIMAL);
        balanceOf[msg.sender] = s_totalSupply;
    }

    //Internal functions
    function _transfer(address _from, address _to, uint256 _value) internal {
        if (_to == address(0)) revert Error__NullAddress();
        if (balanceOf[_from] < _value) revert Error__LowBalance();
        balanceOf[_from] -= _value;
        balanceOf[_to] += _value;
        emit Token__Transfer(_from, _to, _value, balanceOf[_from]);
    }

    //Public functions
    function transfer(
        address _receiver,
        uint256 _value
    ) public returns (bool success) {
        if (balanceOf[msg.sender] < _value) revert Error__LowBalance();
        _transfer(msg.sender, _receiver, _value);
        return true;
    }

    function approve(
        address _spender,
        uint256 _value
    ) public returns (bool success) {
        if (_spender == address(0)) revert Error__NullAddress();
        if (balanceOf[msg.sender] < _value) revert Error__LowBalance();
        allowance[msg.sender][_spender] = _value;
        emit Token__Approve(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(
        address _from,
        address _to,
        uint256 _value
    ) public returns (bool success) {
        if (allowance[_from][msg.sender] < _value) revert Error__LowBalance();
        if (_to == address(0)) revert Error__NullAddress();
        allowance[_from][msg.sender] -= _value;
        _transfer(_from, _to, _value);
        return true;
    }

    //Getters function
    function getName() public view returns (string memory) {
        return s_name;
    }

    function getSymbol() public view returns (string memory) {
        return s_symbol;
    }

    function getTotalSupply() public view returns (uint256) {
        return s_totalSupply;
    }

    function getBalance(address _index) public view returns (uint256) {
        return balanceOf[_index];
    }

    function getApproval(
        address _sender,
        address _receiver
    ) public view returns (uint256) {
        return allowance[_sender][_receiver];
    }
}
