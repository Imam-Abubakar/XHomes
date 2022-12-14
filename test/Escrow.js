const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
    return ethers.utils.parseUnits(n.toString(), 'ether')
}

describe('Escrow', () => {
    let buyer, seller, inspector, lender
    let realEstate, escrow

    beforeEach(async () => {
        [buyer, seller, inspector, lender] = await ethers.getSigners()
        // Deploy Real Estate
        const RealEstate = await ethers.getContractFactory('RealEstate')
        realEstate = await RealEstate.deploy()

        //Mint
        let transaction1 = await realEstate.connect(seller).mint("https://gateway.pinata.cloud/ipfs/QmWAamZPKNo9VNhBzfE1udsaPASQES25i3wsrpov62zR3g/1.json")
        await transaction1.wait()

        const Escrow = await ethers.getContractFactory('Escrow')
        escrow = await Escrow.deploy(
            realEstate.address,
            seller.address,
            inspector.address,
            lender.address
        )

        //Approve property
        let transaction2 = await realEstate.connect(seller).approve(escrow.address, 1)
        await transaction2.wait()

        //List property
        let transaction3 = await escrow.connect(seller).list(1, buyer.address, tokens(0.02), tokens(0.001))
        await transaction3.wait()

    })

    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const result = await escrow.nftAddress()
            expect(result).to.be.equal(realEstate.address)
        })

        it('Returns the seller', async () => {
            const sellerResult = await escrow.seller()
            expect(sellerResult).to.be.equal(seller.address)
        })

        it('Returns the inspector', async () => {
            const inspectResult = await escrow.inspector()
            expect(inspectResult).to.be.equal(inspector.address)
        })

        it('Returns the lender', async () => {
            const lenderResult = await escrow.lender()
            expect(lenderResult).to.be.equal(lender.address)
        })
    })

    describe('Listing', () => {
        it('Updates as listed', async () => {
            const result = await escrow.isListed(1)
            expect(result).to.be.equal(true)
        })

        it('Stores the Purchase Price', async () => {
            const result = await escrow.purchasePrice(1)
            expect(result).to.be.equal(tokens(0.02))
        })

        it('Returns Buyer', async () => {
            const result = await escrow.buyer(1)
            expect(result).to.be.equal(buyer.address)
        })

        it('Stores the Escrow Amount', async () => {
            const result = await escrow.escrowAmount(1)
            expect(result).to.be.equal(tokens(0.001))
        })

        it('Moves NFT to escrow', async () => {
            expect(await realEstate.ownerOf(1)).to.be.equal(escrow.address)
        })

        

    })

    describe('Deposits', () => {
        it('Update contract balance', async () => {
            const transaction = await escrow.connect(buyer).depositEarnest(1, {value: tokens(0.001)})
            await transaction.wait()
            const result = await escrow.getBalance()
            expect(result).to.be.equal(tokens(0.001))
        })

        it('Update inspection status', async () => {
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true)
            await transaction.wait()
            const result = await escrow.inspectionPassed(1)
            expect(result).to.be.equal(true)
        })

        

    })


})
