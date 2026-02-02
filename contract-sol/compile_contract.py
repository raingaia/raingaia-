import sys
from solcx import install_solc, compile_source

def compile_seal():
    print("⏳ Solidity Derleyicisi (v0.8.0) hazirlaniyor...")
    # 1. Derleyiciyi indir ve kur (Sadece ilk seferde çalışır)
    install_solc('0.8.0')
    
    # 2. Kontrat dosyasını oku
    print("📂 DigitalSeal.sol dosyasi okunuyor...")
    with open('DigitalSeal.sol', 'r') as f:
        contract_source = f.read()
        
    # 3. Derleme İşlemi (Compiling)
    print("🔨 Derleme basladi...")
    compiled_sol = compile_source(
        contract_source,
        output_values=['abi', 'bin'],
        solc_version='0.8.0'
    )
    
    # 4. Sonuçları Al
    contract_id, contract_interface = compiled_sol.popitem()
    bytecode = contract_interface['bin']
    abi = contract_interface['abi']
    
    print("\n" + "="*40)
    print("🎉 DERLEME BAŞARILI! (HARDCORE MODE)")
    print("="*40)
    print(f"📄 Kontrat ID: {contract_id}")
    print(f"🤖 Bytecode Uzunlugu: {len(bytecode)} karakter")
    print(f"🔗 Bytecode (İlk 50 karakter): 0x{bytecode[:50]}...")
    print("="*40)
    print("✅ Bu kod artık Ethereum ağina girmeye hazir.")

if __name__ == "__main__":
    try:
        compile_seal()
    except Exception as e:
        print(f"\n❌ HATA: Derleme başarisiz!\n{e}")
        sys.exit(1)
