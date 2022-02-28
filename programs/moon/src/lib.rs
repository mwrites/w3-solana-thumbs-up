use anchor_lang::prelude::*;

declare_id!("EGWf3mBuwhvjmR134QfzKGMo8EgtsC4ieMP3D6mxWFXq");

#[program]
pub mod moon {
    use super::*;
    pub fn initialize(ctx: Context<Initialize>, base_account_bump: u8) -> ProgramResult {
        ctx.accounts.base_account.bump = base_account_bump;

        // Get a reference to the account.
        let base_account = &mut ctx.accounts.base_account;
        // Initialize total_gifs.
        base_account.total_gifs = 0;
        base_account.gif_list = Vec::new();
        Ok(())
    }

    // Another function woo!
    pub fn add_gif(ctx: Context<GifApi>, gif_link: String) -> ProgramResult {
        // Get a reference to the account and increment total_gifs.
        let base_account = &mut ctx.accounts.base_account;
        let user = &mut ctx.accounts.user;

        // TOOD: do not send the same gif twice

        let user_address = &*user.to_account_info().key.to_string().clone();
        let url: String = gif_link.clone();
        let mut id = "0x".to_string();
        id.push_str(&user_address);
        id.push_str("_");
        id.push_str(&url);

        // Build the struct.
        let item = ItemStruct {
            votes: 0,
            id: id,
            gif_link: gif_link.to_string(),
            user_address: *user.to_account_info().key,
        };

        // Add it to the gif_list vector.
        base_account.gif_list.push(item);
        base_account.total_gifs += 1;
        Ok(())
    }

    pub fn upvote_gif(ctx: Context<GifApi>, gif_id: String) -> ProgramResult {
        // Get a reference to the account and increment total_gifs.
        let base_account = &mut ctx.accounts.base_account;
        // TODO: do not let same user vote on same image twice
        // let user = &mut ctx.accounts.user;

        let index = base_account
            .gif_list
            .iter()
            .position(|r| r.id == gif_id)
            .unwrap();
        let mut gif = &mut base_account.gif_list[index];
        gif.votes += 1;

        Ok(())
    }
}

// Attach certain variables to the StartStuffOff context.
#[derive(Accounts)]
#[instruction(base_account_bump: u8)]
pub struct Initialize<'info> {
    // TODO: Space to be tweaked or use pdas as hashmap for more flexibility
    #[account(init, seeds = [b"base_account22".as_ref()], bump = base_account_bump, payer = user, space = 9000)]
    pub base_account: Account<'info, BaseAccount>,
    pub user: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct GifApi<'info> {
    #[account(mut, seeds = [b"base_account22".as_ref()], bump = base_account.bump)]
    pub base_account: Account<'info, BaseAccount>,
    #[account(mut)]
    pub user: Signer<'info>,
}

#[derive(Debug, Clone, AnchorSerialize, AnchorDeserialize)]
pub struct ItemStruct {
    pub id: String,
    pub gif_link: String,
    pub user_address: Pubkey,
    pub votes: u64,
}

#[account]
#[derive(Default)]
pub struct BaseAccount {
    pub total_gifs: u64,
    // /!\ Make sure to initialize the BaseAccount space since we are using a vec here
    pub gif_list: Vec<ItemStruct>,
    pub bump: u8,
}
